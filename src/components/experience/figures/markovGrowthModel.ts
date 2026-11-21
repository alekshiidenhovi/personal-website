/**
 * @fileoverview A simplified user growth model as a Markov chain, laid out for drawing: each engagement state is a
 * box, and each transition between two states an arrow that players travel along. Dormant players can churn,
 * leaving the product, and are replaced by new sign-ups.
 */

import { interpolate, pickWeightedIndex, type Vector } from '../../../lib/math';
import { formatPoints } from '../../../lib/svg';

/** A player's engagement state. */
export type PlayerState = 'reactivated' | 'new' | 'resurrected' | 'current' | 'atRisk' | 'dormant';

/** A state's box in the drawing. */
export interface StateBox {
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** An arrow ready to draw. */
export interface DrawnArrow {
  /** Identifies the transition the arrow stands for. */
  readonly key: string;
  /** The line's `d` attribute. */
  readonly path: string;
  /** The arrowhead polygon's `points` attribute. */
  readonly head: string;
}

/** A player's move to another state on a tick. */
export interface Move {
  readonly destination: PlayerState;
  /** The path to travel, from where the player starts to where it lands in the destination's box. */
  readonly route: readonly Vector[];
  /** The key of the arrow travelled along. */
  readonly arrowKey: string;
  /** Whether the player churned and is replaced by a new sign-up, entering from outside the drawing. */
  readonly isReplacement: boolean;
}

/** Where a player can go on a tick: a state, or out of the product. */
type Outcome = PlayerState | 'churned';

/** One possible outcome of a tick for a player in some state. */
interface Transition {
  readonly outcome: Outcome;
  readonly probability: number;
}

/** The path drawn for a transition between two different states. */
interface ArrowRoute {
  readonly from: PlayerState;
  readonly to: PlayerState;
  readonly points: readonly Vector[];
}

/** The states, in drawing order. */
export const PLAYER_STATES: readonly PlayerState[] = [
  'reactivated',
  'new',
  'resurrected',
  'current',
  'atRisk',
  'dormant',
];

export const STATE_BOXES: Readonly<Record<PlayerState, StateBox>> = {
  reactivated: { label: 'reactivated', x: 40, y: 8, width: 92, height: 30 },
  new: { label: 'new', x: 154, y: 8, width: 92, height: 30 },
  resurrected: { label: 'resurrected', x: 268, y: 8, width: 92, height: 30 },
  current: { label: 'current', x: 150, y: 70, width: 100, height: 42 },
  atRisk: { label: 'at risk', x: 40, y: 134, width: 250, height: 30 },
  // Starts further right, leaving the bottom-left corner to the day counter
  dormant: { label: 'dormant', x: 64, y: 182, width: 296, height: 30 },
};

const TRANSITIONS: Readonly<Record<PlayerState, readonly Transition[]>> = {
  new: [
    { outcome: 'current', probability: 0.55 },
    { outcome: 'atRisk', probability: 0.45 },
  ],
  reactivated: [
    { outcome: 'current', probability: 0.5 },
    { outcome: 'atRisk', probability: 0.5 },
  ],
  resurrected: [
    { outcome: 'current', probability: 0.4 },
    { outcome: 'atRisk', probability: 0.6 },
  ],
  current: [
    { outcome: 'current', probability: 0.85 },
    { outcome: 'atRisk', probability: 0.15 },
  ],
  atRisk: [
    { outcome: 'current', probability: 0.2 },
    { outcome: 'atRisk', probability: 0.45 },
    { outcome: 'dormant', probability: 0.25 },
    { outcome: 'reactivated', probability: 0.1 },
  ],
  dormant: [
    { outcome: 'dormant', probability: 0.8 },
    { outcome: 'resurrected', probability: 0.08 },
    { outcome: 'churned', probability: 0.12 },
  ],
};

// biome-ignore format: one route per line reads as a table
const ARROW_ROUTES: readonly ArrowRoute[] = [
  { from: 'new', to: 'current', points: [[200, 38], [200, 70]] },
  { from: 'reactivated', to: 'current', points: [[100, 38], [100, 58], [164, 58], [164, 70]] },
  { from: 'resurrected', to: 'current', points: [[300, 38], [300, 58], [236, 58], [236, 70]] },
  { from: 'reactivated', to: 'atRisk', points: [[60, 38], [60, 134]] },
  { from: 'new', to: 'atRisk', points: [[246, 23], [258, 23], [258, 134]] },
  { from: 'resurrected', to: 'atRisk', points: [[330, 38], [330, 149], [290, 149]] },
  { from: 'current', to: 'atRisk', points: [[216, 112], [216, 134]] },
  { from: 'atRisk', to: 'current', points: [[184, 134], [184, 112]] },
  { from: 'atRisk', to: 'dormant', points: [[268, 164], [268, 182]] },
  { from: 'atRisk', to: 'reactivated', points: [[40, 149], [24, 149], [24, 23], [40, 23]] },
  { from: 'dormant', to: 'resurrected', points: [[360, 197], [378, 197], [378, 23], [360, 23]] },
];

/** New sign-ups enter the new box from above, replacing churned players. */
const INFLOW_ROUTE: readonly Vector[] = [
  [200, -16],
  [200, 8],
];
const INFLOW_ARROW_KEY = 'signup->new';

/*
 * Arrowheads are drawn as shapes in the figure's own units rather than SVG markers, which Chrome renders at
 * screen size on non-scaling strokes.
 */
const HEAD_LENGTH = 4.5;
const HEAD_HALF_WIDTH = 2;
/** Room for the state's label and count at the top of its box. */
const BOX_LABEL_SPACE = 13;
const BOX_PADDING = 5;

/**
 * Gets the key of the arrow for a transition.
 *
 * @param from The state left.
 * @param to The state entered.
 * @returns The key.
 */
function getArrowKey(from: PlayerState, to: PlayerState): string {
  return `${from}->${to}`;
}

/**
 * Shapes the end of an arrow: its head, and where its line stops, inside the head, so the line's round cap never
 * pokes past the tip.
 *
 * @param from The point the last stretch of the line comes from.
 * @param tip The arrow's tip.
 * @returns Where the line ends, and the head's `points` attribute.
 */
function shapeArrowEnd(from: Vector, tip: Vector): { lineEnd: Vector; head: string } {
  const length = Math.hypot(tip[0] - from[0], tip[1] - from[1]);
  const directionX = (tip[0] - from[0]) / length;
  const directionY = (tip[1] - from[1]) / length;
  const base: Vector = [tip[0] - directionX * HEAD_LENGTH, tip[1] - directionY * HEAD_LENGTH];
  const lineEnd: Vector = [tip[0] - (directionX * HEAD_LENGTH) / 2, tip[1] - (directionY * HEAD_LENGTH) / 2];
  const head = formatPoints([
    tip,
    [base[0] - directionY * HEAD_HALF_WIDTH, base[1] + directionX * HEAD_HALF_WIDTH],
    [base[0] + directionY * HEAD_HALF_WIDTH, base[1] - directionX * HEAD_HALF_WIDTH],
  ]);
  return { lineEnd, head };
}

/**
 * Shapes an arrow along a path, its head at the path's end.
 *
 * @param key The key of the transition it stands for.
 * @param points The path, at least two points long.
 * @returns The arrow, ready to draw.
 */
function shapeArrow(key: string, points: readonly Vector[]): DrawnArrow {
  const { lineEnd, head } = shapeArrowEnd(points[points.length - 2], points[points.length - 1]);
  const line = [...points.slice(0, -1), lineEnd];
  const path = line.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
  return { key, path, head };
}

/**
 * Shapes the loop of current players staying put: a curve on the left of the box, back into it.
 *
 * @returns The loop's `d` attribute and its head's `points` attribute.
 */
function shapeStayLoop(): { path: string; head: string } {
  const lastControlPoint: Vector = [124, 106];
  const { lineEnd, head } = shapeArrowEnd(lastControlPoint, [150, 100]);
  return { path: `M150 80 C124 72 ${lastControlPoint.join(' ')} ${lineEnd.join(' ')}`, head };
}

/** Every arrow between two different states, and the inflow of new sign-ups. */
export const DRAWN_ARROWS: readonly DrawnArrow[] = [
  ...ARROW_ROUTES.map((route) => shapeArrow(getArrowKey(route.from, route.to), route.points)),
  shapeArrow(INFLOW_ARROW_KEY, INFLOW_ROUTE),
];

/** The loop of current players staying current. */
export const STAY_LOOP = shapeStayLoop();

/**
 * Picks a random spot for a player in a state's box, clear of its label.
 *
 * @param state The state.
 * @returns The spot.
 */
export function pickPositionInBox(state: PlayerState): Vector {
  const box = STATE_BOXES[state];
  return [
    box.x + BOX_PADDING + Math.random() * (box.width - BOX_PADDING * 2),
    box.y + BOX_LABEL_SPACE + Math.random() * (box.height - BOX_LABEL_SPACE - BOX_PADDING),
  ];
}

/**
 * Samples where a player in a state goes on a tick.
 *
 * @param state The player's state.
 * @returns The outcome.
 */
function sampleOutcome(state: PlayerState): Outcome {
  const transitions = TRANSITIONS[state];
  return transitions[pickWeightedIndex(transitions.map((transition) => transition.probability))].outcome;
}

/**
 * Plans a player's move on a tick, by sampling its transition.
 *
 * @param state The player's state.
 * @param position Where the player is.
 * @returns The move, or undefined when the player stays in its state.
 */
export function planMove(state: PlayerState, position: Vector): Move | undefined {
  const outcome = sampleOutcome(state);
  if (outcome === state) {
    return undefined;
  }
  if (outcome === 'churned') {
    return {
      destination: 'new',
      route: [...INFLOW_ROUTE, pickPositionInBox('new')],
      arrowKey: INFLOW_ARROW_KEY,
      isReplacement: true,
    };
  }
  const arrow = ARROW_ROUTES.find((route) => route.from === state && route.to === outcome);
  if (!arrow) {
    throw new Error(`No arrow drawn for the transition from ${state} to ${outcome}`);
  }
  return {
    destination: outcome,
    route: [position, ...arrow.points, pickPositionInBox(outcome)],
    arrowKey: getArrowKey(state, outcome),
    isReplacement: false,
  };
}

/**
 * Finds the point a share of the way along a path.
 *
 * @param route The path.
 * @param progress How far along, from 0 to 1, by length.
 * @returns The point.
 */
export function getPointAlong(route: readonly Vector[], progress: number): Vector {
  const lengths = route.slice(1).map(([x, y], index) => Math.hypot(x - route[index][0], y - route[index][1]));
  let remaining = progress * lengths.reduce((total, length) => total + length, 0);
  for (const [index, length] of lengths.entries()) {
    if (remaining <= length) {
      const share = length === 0 ? 0 : remaining / length;
      const [startX, startY] = route[index];
      const [endX, endY] = route[index + 1];
      return [interpolate(startX, endX, share), interpolate(startY, endY, share)];
    }
    remaining -= length;
  }
  return route[route.length - 1];
}
