<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { useLiveTicker } from '../../../composables/useLiveTicker';
import type { Vector } from '../../../lib/math';
import { easeInOut, tween } from '../../../lib/motion';
import {
  DRAWN_ARROWS,
  getPointAlong,
  PLAYER_STATES,
  type PlayerState,
  pickPositionInBox,
  planMove,
  STATE_BOXES,
  STAY_LOOP,
} from './markovGrowthModel';

/**
 * A simplified user growth model, simulated as a Markov chain (see markovGrowthModel): every day each player
 * moves between engagement states by the model's probabilities, travelling along the arrow of the transition it
 * takes. Dormant players eventually churn, and are replaced by new sign-ups.
 */
interface Props {
  /** Whether the figure is in view, so it plays. */
  active: boolean;
}
const props = defineProps<Props>();

/** A player on its way to another state. */
interface Travel {
  readonly route: readonly Vector[];
  readonly destination: PlayerState;
}

/** A player, drawn as a dot in the box of its state. */
interface Player {
  readonly id: number;
  /** Counts the player's replacements, so a new sign-up enters as a new dot rather than moving the churned one. */
  generation: number;
  /** The state whose box the player is in; updated once it arrives there. */
  state: PlayerState;
  x: number;
  y: number;
  /** Set while the player travels along a transition's arrow. */
  travel: Travel | undefined;
}

const PLAYER_COUNT = 40;
const DAY_MS = 1500;
const TRAVEL_MS = 1000;
/** The states players start in, repeated across the players: a plausible mix, mostly current. */
const STARTING_STATES: readonly PlayerState[] = [
  'current',
  'current',
  'current',
  'atRisk',
  'atRisk',
  'dormant',
  'new',
  'reactivated',
];

/**
 * Creates a player in its starting state.
 *
 * @param id The player's id.
 * @returns The player.
 */
function createPlayer(id: number): Player {
  const state = STARTING_STATES[id % STARTING_STATES.length];
  const [x, y] = pickPositionInBox(state);
  return { id, generation: 0, state, x, y, travel: undefined };
}

const players = ref(Array.from({ length: PLAYER_COUNT }, (_, id) => createPlayer(id)));
const day = ref(1);
const busyArrowKeys = ref(new Set<string>());
let cancelTravel: (() => void) | undefined;

/** The players settled in each state's box. */
const stateCounts = computed(() => {
  const counts = Object.fromEntries(PLAYER_STATES.map((state) => [state, 0]));
  for (const player of players.value) {
    if (!player.travel) {
      counts[player.state]++;
    }
  }
  return counts;
});

/**
 * Places a travelling player a share of the way along its route, and settles it in its new state at the end.
 *
 * @param player The player.
 * @param progress How far along the route, from 0 to 1.
 */
function movePlayer(player: Player, progress: number) {
  if (!player.travel) {
    return;
  }
  [player.x, player.y] = getPointAlong(player.travel.route, progress);
  if (progress === 1) {
    player.state = player.travel.destination;
    player.travel = undefined;
  }
}

/** Animates every travelling player along its route, and dims the arrows once they have all arrived. */
function animateTravel() {
  cancelTravel = tween(TRAVEL_MS, (progress) => {
    const easedProgress = easeInOut(progress);
    for (const player of players.value) {
      movePlayer(player, easedProgress);
    }
    if (progress === 1) {
      busyArrowKeys.value = new Set();
    }
  });
}

/** Moves on a day: every player samples its transition, and those changing state set off along its arrow. */
function advanceDay() {
  // A travel left unfinished, such as while the tab was in the background, ends where it was going
  cancelTravel?.();
  for (const player of players.value) {
    movePlayer(player, 1);
  }
  const busyKeys = new Set<string>();
  for (const player of players.value) {
    const move = planMove(player.state, [player.x, player.y]);
    if (!move) {
      continue;
    }
    if (move.isReplacement) {
      player.generation++;
      [player.x, player.y] = move.route[0];
    }
    player.travel = { route: move.route, destination: move.destination };
    busyKeys.add(move.arrowKey);
  }
  busyArrowKeys.value = busyKeys;
  day.value++;
  animateTravel();
}

useLiveTicker(() => props.active, advanceDay, DAY_MS);
onUnmounted(() => cancelTravel?.());
</script>

<template>
  <svg class="drawing" :class="{ active: props.active }" viewBox="0 0 400 220" aria-hidden="true">
    <!-- Transitions; an arrow lights up while players travel along it -->
    <g v-for="arrow in DRAWN_ARROWS" :key="arrow.key" class="arrow" :class="{ busy: busyArrowKeys.has(arrow.key) }">
      <path :d="arrow.path" class="drawing-line muted" />
      <polygon :points="arrow.head" class="head" />
    </g>
    <g class="arrow">
      <path :d="STAY_LOOP.path" class="drawing-line muted" />
      <polygon :points="STAY_LOOP.head" class="head" />
    </g>

    <!-- States with live player counts -->
    <g v-for="state in PLAYER_STATES" :key="state" :class="{ key: state === 'current' }">
      <rect :x="STATE_BOXES[state].x" :y="STATE_BOXES[state].y" :width="STATE_BOXES[state].width"
        :height="STATE_BOXES[state].height" rx="3" class="drawing-line box" />
      <text :x="STATE_BOXES[state].x + 5" :y="STATE_BOXES[state].y + 9" class="drawing-text label">{{
        STATE_BOXES[state].label }}</text>
      <text :x="STATE_BOXES[state].x + STATE_BOXES[state].width - 5" :y="STATE_BOXES[state].y + 9" text-anchor="end"
        class="drawing-text count">{{ stateCounts[state] }}</text>
    </g>

    <circle v-for="player in players" :key="`${player.id}-${player.generation}`" :cx="player.x" :cy="player.y" r="2"
      class="drawing-fill accent player" :class="{ travelling: player.travel }" />

    <!-- Where the topic modeling pipeline figure has its status line -->
    <text x="10" y="206" class="drawing-text label">day {{ day }}</text>
  </svg>
</template>

<style scoped>
.box {
  fill: var(--card-color);
  fill-opacity: 0;
}

.key .box {
  stroke: var(--drawing-accent);
  fill-opacity: 0.08;
}

.count {
  font-size: 8px;
  fill: var(--drawing-accent);
}

.head {
  fill: var(--neutral-500);
}

.arrow.busy .drawing-line {
  stroke: var(--drawing-accent);
  stroke-opacity: 0.7;
}

.arrow.busy .head {
  fill: var(--drawing-accent);
}

.player {
  animation: fade-in 0.6s ease;
}

.player.travelling {
  filter: drop-shadow(0 0 2px var(--card-color));
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}
</style>
