<script setup lang="ts">
import { computed, onUnmounted, ref, toRef, useId } from "vue";
import { useLiveTicker } from "../../composables/useLiveTicker";

/**
 * A simplified user growth model simulated as a Markov chain: every tick each
 * player moves between engagement states with the probabilities below,
 * travelling along the arrow of the transition it takes. Dormant players
 * eventually leave and are replaced by new sign-ups.
 */

interface Props {
  active: boolean;
}
const props = defineProps<Props>();

type State = "reactivated" | "new" | "resurrected" | "current" | "atRisk" | "dormant";
type Point = [x: number, y: number];

interface Box {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const BOXES: Record<State, Box> = {
  reactivated: { label: "reactivated", x: 40, y: 8, width: 92, height: 30 },
  new: { label: "new", x: 154, y: 8, width: 92, height: 30 },
  resurrected: { label: "resurrected", x: 268, y: 8, width: 92, height: 30 },
  current: { label: "current", x: 150, y: 70, width: 100, height: 42 },
  atRisk: { label: "at risk", x: 40, y: 134, width: 250, height: 30 },
  dormant: { label: "dormant", x: 40, y: 182, width: 320, height: 30 },
};
const STATES = Object.keys(BOXES) as State[];

/** Leaving the product entirely; the player is replaced by a new sign-up */
type Outcome = State | "churned";

const TRANSITIONS: Record<State, [Outcome, number][]> = {
  new: [["current", 0.55], ["atRisk", 0.45]],
  reactivated: [["current", 0.5], ["atRisk", 0.5]],
  resurrected: [["current", 0.4], ["atRisk", 0.6]],
  current: [["current", 0.85], ["atRisk", 0.15]],
  atRisk: [["current", 0.2], ["atRisk", 0.45], ["dormant", 0.25], ["reactivated", 0.1]],
  dormant: [["dormant", 0.8], ["resurrected", 0.08], ["churned", 0.12]],
};

interface Arrow {
  from: State;
  to: State;
  points: Point[];
  label?: { text: string; x: number; y: number };
}

/** Every transition between different states, drawn along these paths */
const ARROWS: Arrow[] = [
  { from: "new", to: "current", points: [[200, 38], [200, 70]], label: { text: "NURR", x: 204, y: 52 } },
  {
    from: "reactivated",
    to: "current",
    points: [[100, 38], [100, 58], [164, 58], [164, 70]],
    label: { text: "RURR", x: 104, y: 52 },
  },
  {
    from: "resurrected",
    to: "current",
    points: [[300, 38], [300, 58], [236, 58], [236, 70]],
    label: { text: "SURR", x: 304, y: 52 },
  },
  { from: "reactivated", to: "atRisk", points: [[60, 38], [60, 134]] },
  { from: "new", to: "atRisk", points: [[246, 23], [258, 23], [258, 134]] },
  { from: "resurrected", to: "atRisk", points: [[330, 38], [330, 149], [290, 149]] },
  { from: "current", to: "atRisk", points: [[216, 112], [216, 134]] },
  { from: "atRisk", to: "current", points: [[184, 134], [184, 112]], label: { text: "iWAURR", x: 146, y: 126 } },
  { from: "atRisk", to: "dormant", points: [[268, 164], [268, 182]], label: { text: "loss", x: 274, y: 176 } },
  { from: "atRisk", to: "reactivated", points: [[40, 149], [24, 149], [24, 23], [40, 23]] },
  { from: "dormant", to: "resurrected", points: [[360, 197], [378, 197], [378, 23], [360, 23]] },
];
const arrowKey = (from: State, to: State) => `${from}->${to}`;
const ARROWS_BY_KEY = new Map(ARROWS.map((arrow) => [arrowKey(arrow.from, arrow.to), arrow]));
const toPath = (points: Point[]) => points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");

const PLAYER_COUNT = 40;
const TICK_MS = 1500;
const MOVE_MS = 1000;
const LABEL_SPACE = 13;
const PADDING = 5;

interface Player {
  id: number;
  /** Bumped when a churned player is replaced, so it re-enters without travelling */
  generation: number;
  /** The box the player is shown in; updated when it arrives */
  state: State;
  x: number;
  y: number;
  /** Set while travelling along a transition's arrow */
  route: Point[] | null;
}

const randomPointIn = (state: State): Point => {
  const box = BOXES[state];
  return [
    box.x + PADDING + Math.random() * (box.width - PADDING * 2),
    box.y + LABEL_SPACE + Math.random() * (box.height - LABEL_SPACE - PADDING),
  ];
};

const sampleOutcome = (state: State): Outcome => {
  let roll = Math.random();
  for (const [outcome, probability] of TRANSITIONS[state]) {
    roll -= probability;
    if (roll < 0) return outcome;
  }
  return state;
};

/** The point a fraction `t` of the way along a polyline */
const pointAlong = (route: Point[], t: number): Point => {
  const lengths = route.slice(1).map(([x, y], i) => Math.hypot(x - route[i][0], y - route[i][1]));
  let remaining = t * lengths.reduce((total, length) => total + length, 0);
  for (const [i, length] of lengths.entries()) {
    if (remaining <= length) {
      const ratio = length === 0 ? 0 : remaining / length;
      return [route[i][0] + (route[i + 1][0] - route[i][0]) * ratio, route[i][1] + (route[i + 1][1] - route[i][1]) * ratio];
    }
    remaining -= length;
  }
  return route[route.length - 1];
};

const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

const INITIAL_STATES: State[] = ["current", "current", "current", "atRisk", "atRisk", "dormant", "new", "reactivated"];
const players = ref<Player[]>(
  Array.from({ length: PLAYER_COUNT }, (_, id) => {
    const state = INITIAL_STATES[id % INITIAL_STATES.length];
    const [x, y] = randomPointIn(state);
    return { id, generation: 0, state, x, y, route: null };
  }),
);
const week = ref(1);
const busyArrows = ref(new Set<string>());
let frameId = 0;

/** Moves travelling players along their routes, then settles them in their new box */
const animateMoves = (destinations: Map<number, State>) => {
  const startTime = performance.now();
  const frame = (now: number) => {
    const t = Math.min((now - startTime) / MOVE_MS, 1);
    for (const player of players.value) {
      if (!player.route) continue;
      [player.x, player.y] = pointAlong(player.route, easeInOut(t));
      if (t === 1) {
        player.state = destinations.get(player.id) ?? player.state;
        player.route = null;
      }
    }
    if (t < 1) frameId = requestAnimationFrame(frame);
    else busyArrows.value = new Set();
  };
  frameId = requestAnimationFrame(frame);
};

useLiveTicker(
  toRef(props, "active"),
  () => {
    const destinations = new Map<number, State>();
    const busy = new Set<string>();

    for (const player of players.value) {
      const outcome = sampleOutcome(player.state);
      if (outcome === player.state) continue;
      if (outcome === "churned") {
        const [x, y] = randomPointIn("new");
        Object.assign(player, { generation: player.generation + 1, state: "new", x, y });
        continue;
      }
      const arrow = ARROWS_BY_KEY.get(arrowKey(player.state, outcome));
      if (!arrow) continue;
      player.route = [[player.x, player.y], ...arrow.points, randomPointIn(outcome)];
      destinations.set(player.id, outcome);
      busy.add(arrowKey(arrow.from, arrow.to));
    }

    busyArrows.value = busy;
    week.value++;
    animateMoves(destinations);
  },
  TICK_MS,
);

onUnmounted(() => cancelAnimationFrame(frameId));

const counts = computed(() =>
  Object.fromEntries(STATES.map((state) => [state, players.value.filter((p) => p.state === state && !p.route).length])),
);

const arrowMarkerId = useId();
</script>

<template>
  <svg class="cover" :class="{ active: props.active }" viewBox="0 0 400 220" aria-hidden="true">
    <defs>
      <marker :id="arrowMarkerId" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5"
        orient="auto-start-reverse">
        <path d="M0 0 L6 3 L0 6" class="cover-line" />
      </marker>
    </defs>

    <!-- Transitions; an arrow lights up while players travel along it -->
    <g v-for="arrow in ARROWS" :key="arrowKey(arrow.from, arrow.to)">
      <path :d="toPath(arrow.points)" class="cover-line muted arrow"
        :class="{ busy: busyArrows.has(arrowKey(arrow.from, arrow.to)) }" :marker-end="`url(#${arrowMarkerId})`" />
      <text v-if="arrow.label" :x="arrow.label.x" :y="arrow.label.y" class="cover-text label">{{ arrow.label.text }}</text>
    </g>
    <path d="M150 80 C124 72 124 106 150 100" class="cover-line muted" :marker-end="`url(#${arrowMarkerId})`" />
    <text x="120" y="93" text-anchor="end" class="cover-text label">CURR</text>
    <text x="16" y="86" text-anchor="middle" transform="rotate(-90 16 86)" class="cover-text label">reactivation</text>
    <text x="386" y="110" text-anchor="middle" transform="rotate(90 386 110)" class="cover-text label">resurrection</text>

    <!-- States with live player counts -->
    <g v-for="state in STATES" :key="state" :class="{ key: state === 'current' }">
      <rect :x="BOXES[state].x" :y="BOXES[state].y" :width="BOXES[state].width" :height="BOXES[state].height"
        rx="3" class="cover-line box" />
      <text :x="BOXES[state].x + 5" :y="BOXES[state].y + 9" class="cover-text label">{{ BOXES[state].label }}</text>
      <text :x="BOXES[state].x + BOXES[state].width - 5" :y="BOXES[state].y + 9" text-anchor="end"
        class="cover-text count">{{ counts[state] }}</text>
    </g>

    <!-- Players -->
    <circle v-for="player in players" :key="`${player.id}-${player.generation}`" :cx="player.x" :cy="player.y" r="2"
      class="cover-fill accent player" :class="{ travelling: player.route }" />

    <text x="300" y="128" class="cover-text label">week {{ week }}</text>
  </svg>
</template>

<style scoped>
.box {
  fill: var(--card-color);
  fill-opacity: 0;
}

.key .box {
  stroke: var(--cover-accent);
  fill-opacity: 0.08;
}

.count {
  font-size: 8px;
  fill: var(--cover-accent);
}

.arrow.busy {
  stroke: var(--cover-accent);
  stroke-opacity: 0.7;
}

.player {
  animation: enter 0.6s ease;
}

.player.travelling {
  filter: drop-shadow(0 0 2px var(--card-color));
}

@keyframes enter {
  from {
    opacity: 0;
  }
}
</style>
