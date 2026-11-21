<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLiveTicker } from '../../../composables/useLiveTicker';
import FlowArrow from '../../ui/FlowArrow.vue';

/**
 * Support tickets classified by GPT-3. Tickets queue up from above; the active ticket, level with the model, is
 * scanned and routed to a category with a confidence score, then leaves to the left as the queue moves down.
 */
interface Props {
  /** Whether the figure is in view, so it plays. */
  active: boolean;
}
const props = defineProps<Props>();

const CATEGORIES = ['bug', 'billing', 'hardware', 'feedback'] as const;
type Category = (typeof CATEGORIES)[number];

/** A ticket's classification. */
interface Classification {
  readonly category: Category;
  /** From 0 to 1. */
  readonly confidence: number;
}

/** An example ticket, with the classification the model gives it. */
interface Ticket extends Classification {
  readonly text: string;
}

/** Where a ticket is in the inbox. */
type TicketPosition = 'exiting' | 'active' | 'queued';

// Illustrative examples, enough to feel endless when looped; short enough to sit well inside the ticket
const TICKETS: readonly Ticket[] = [
  { text: 'App crashes on sync', category: 'bug', confidence: 0.94 },
  { text: 'I was charged twice', category: 'billing', confidence: 0.91 },
  { text: "Sensor won't pair", category: 'hardware', confidence: 0.88 },
  { text: 'Love the new insights!', category: 'feedback', confidence: 0.97 },
  { text: 'Graph shows wrong day', category: 'bug', confidence: 0.86 },
  { text: 'How do I cancel?', category: 'billing', confidence: 0.83 },
  { text: 'Sensor fell off early', category: 'hardware', confidence: 0.9 },
  { text: "Meal log won't save", category: 'bug', confidence: 0.92 },
  { text: 'Great tips this week', category: 'feedback', confidence: 0.95 },
  { text: 'Refund for last month?', category: 'billing', confidence: 0.89 },
  { text: 'Readings look off', category: 'hardware', confidence: 0.81 },
  { text: 'Login loop on update', category: 'bug', confidence: 0.93 },
  { text: 'Switch to yearly?', category: 'billing', confidence: 0.87 },
  { text: 'Coaching really helps', category: 'feedback', confidence: 0.96 },
  { text: 'Bluetooth drops out', category: 'hardware', confidence: 0.85 },
  { text: 'Notifications stopped', category: 'bug', confidence: 0.84 },
  { text: 'Card was declined', category: 'billing', confidence: 0.9 },
  { text: 'Applicator is jammed', category: 'hardware', confidence: 0.88 },
  { text: 'Please add dark mode', category: 'feedback', confidence: 0.82 },
  { text: 'Export to CSV fails', category: 'bug', confidence: 0.89 },
];
/** The tickets waiting above the active one. */
const QUEUE_LENGTH = 2;
/** Each ticket takes two steps: being classified, then routed. */
const STEP_MS = 1100;

const MODEL = { x: 166, y: 66, width: 80, height: 76 };
const MODEL_CENTER_Y = MODEL.y + MODEL.height / 2;
/** The active ticket is level with the model, so the arrow lines up with both. */
const TICKET = { x: 10, width: 136, height: 24, slot: 30 };
const ACTIVE_TICKET_Y = MODEL_CENTER_Y - TICKET.height / 2;
const BIN = { x: 272, y: 40, width: 118, height: 28, gap: 8 };
const EXIT_OFFSET_X = -24;

/**
 * Gets the top edge of a category's bin.
 *
 * @param index The category's index.
 * @returns The bin's y coordinate.
 */
function getBinY(index: number): number {
  return BIN.y + index * (BIN.height + BIN.gap);
}

/**
 * Gets the ticket with a number, looping through the examples.
 *
 * @param ticketNumber The ticket's number, counting every ticket since the figure started.
 * @returns The ticket.
 */
function getTicket(ticketNumber: number): Ticket {
  return TICKETS[ticketNumber % TICKETS.length];
}

/**
 * Gets the arm from the model to a category's bin.
 *
 * @param index The category's index.
 * @returns The path's `d` attribute.
 */
function getArmPath(index: number): string {
  const binCenterY = getBinY(index) + BIN.height / 2;
  return `M${MODEL.x + MODEL.width} ${MODEL_CENTER_Y} C258 ${MODEL_CENTER_Y} 258 ${binCenterY} ${BIN.x} ${binCenterY}`;
}

const step = ref(0);
const routedCounts = ref<Record<Category, number>>({ bug: 0, billing: 0, hardware: 0, feedback: 0 });
/**
 * The latest routing, kept apart from the active ticket so that the highlight fades out showing the ticket that
 * was routed, not the next one.
 */
const lastClassification = ref<Classification>();

/** The number of the ticket being classified; it grows forever, while the examples loop. */
const activeTicketNumber = computed(() => Math.floor(step.value / 2));
const isRouted = computed(() => step.value % 2 === 1);

/** The ticket that just left, the active one and the queue above it, keyed by ticket number. */
const visibleTickets = computed(() =>
  Array.from({ length: QUEUE_LENGTH + 2 }, (_, index) => index - 1)
    // Before the first ticket has been routed, no ticket is leaving
    .filter((offset) => activeTicketNumber.value + offset >= 0)
    .map((offset) => {
      const ticketNumber = activeTicketNumber.value + offset;
      const position: TicketPosition = offset < 0 ? 'exiting' : offset === 0 ? 'active' : 'queued';
      const transform =
        position === 'exiting' ? `translate(${EXIT_OFFSET_X}px, 0px)` : `translate(0px, ${-offset * TICKET.slot}px)`;
      return { ticketNumber, offset, position, transform, text: getTicket(ticketNumber).text };
    }),
);

/** Moves the active ticket on a step: from being classified to routed, or on to the next ticket. */
function advance() {
  step.value++;
  if (!isRouted.value) {
    return;
  }
  const { category, confidence } = getTicket(activeTicketNumber.value);
  routedCounts.value[category]++;
  lastClassification.value = { category, confidence };
}

useLiveTicker(() => props.active, advance, STEP_MS);
</script>

<template>
  <svg class="drawing" :class="{ active: props.active, routed: isRouted }" viewBox="0 0 400 220" aria-hidden="true"
    :style="{ '--step-duration': `${STEP_MS}ms` }">
    <text :x="TICKET.x + TICKET.width / 2" y="16" text-anchor="middle" class="drawing-text label">support inbox</text>
    <text :x="MODEL.x + MODEL.width / 2" y="16" text-anchor="middle" class="drawing-text label">classifier</text>
    <text :x="BIN.x + BIN.width / 2" y="16" text-anchor="middle" class="drawing-text label">category · confidence</text>

    <!-- Inbox: tickets arrive from above, the active one is classified, then leaves to the left -->
    <g v-for="ticket in visibleTickets" :key="ticket.ticketNumber" class="ticket" :class="ticket.position"
      :style="{ transform: ticket.transform, '--queue-opacity': 1 - ticket.offset * 0.3 }">
      <rect :x="TICKET.x" :y="ACTIVE_TICKET_Y" :width="TICKET.width" :height="TICKET.height" rx="3"
        class="drawing-line ticket-frame" />
      <rect :x="TICKET.x" :y="ACTIVE_TICKET_Y + 4" width="2" :height="TICKET.height - 8" class="marker" />
      <text :x="TICKET.x + 9" :y="ACTIVE_TICKET_Y + 15" class="drawing-text ticket-text">{{ ticket.text }}</text>
      <line v-if="ticket.position === 'active'" :x1="TICKET.x + 4" :y1="ACTIVE_TICKET_Y + 2" :x2="TICKET.x + 4"
        :y2="ACTIVE_TICKET_Y + TICKET.height - 2" class="drawing-line accent scan" />
    </g>

    <FlowArrow :x1="TICKET.x + TICKET.width + 2" :x2="MODEL.x - 2" :y="MODEL_CENTER_Y" />

    <rect :x="MODEL.x" :y="MODEL.y" :width="MODEL.width" :height="MODEL.height" rx="6"
      class="drawing-line accent model glow" />
    <text :x="MODEL.x + MODEL.width / 2" :y="MODEL.y + 34" text-anchor="middle"
      class="drawing-text accent model-name">GPT-3</text>
    <g class="thinking">
      <circle v-for="dot in 3" :key="dot" :cx="MODEL.x + 28 + dot * 6" :cy="MODEL.y + 52" r="1.6"
        class="drawing-fill accent" :style="{ animationDelay: `${dot * 0.15}s` }" />
    </g>
    <text :x="MODEL.x + MODEL.width / 2" :y="MODEL.y + 52" text-anchor="middle" class="drawing-text label verdict">
      <template v-if="lastClassification">{{ lastClassification.category }} {{
        lastClassification.confidence.toFixed(2) }}</template></text>

    <!-- Every arm is always drawn; the matched one lights up once routed -->
    <path v-for="(category, index) in CATEGORIES" :key="category" :d="getArmPath(index)" class="drawing-line muted arm"
      :class="{ chosen: category === lastClassification?.category }" />

    <g v-for="(category, index) in CATEGORIES" :key="category" class="bin"
      :class="{ chosen: category === lastClassification?.category }">
      <rect :x="BIN.x" :y="getBinY(index)" :width="BIN.width" :height="BIN.height" rx="3"
        class="drawing-line bin-frame" />
      <text :x="BIN.x + 7" :y="getBinY(index) + 12" class="drawing-text">{{ category }}</text>
      <text :x="BIN.x + BIN.width - 7" :y="getBinY(index) + 12" text-anchor="end" class="drawing-text label">
        {{ routedCounts[category] }}</text>
      <rect :x="BIN.x + 7" :y="getBinY(index) + 18" :width="(BIN.width - 14) * (lastClassification?.confidence ?? 0)"
        height="4" class="drawing-fill accent confidence" />
    </g>
  </svg>
</template>

<style scoped>
.ticket {
  transition:
    transform 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.6s ease;
}

.ticket-frame {
  fill: var(--neutral-900);
}

.ticket-text {
  font-size: 8px;
}

.marker {
  fill: var(--card-color);
  opacity: 0;
}

/* Waiting tickets fade with distance; the newest drops in from above */
.ticket.queued {
  opacity: var(--queue-opacity);
  animation: drop-in 0.6s ease-out;
}

@keyframes drop-in {
  from {
    opacity: 0;
    translate: 0 -12px;
  }
}

.ticket.active .ticket-frame {
  stroke: var(--drawing-accent);
  fill: color-mix(in srgb, var(--card-color), var(--neutral-900) 88%);
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--card-color), transparent 50%));
}

.ticket.active .marker {
  opacity: 1;
}

.ticket.active .ticket-text {
  fill: var(--neutral-100);
}

.routed .ticket.active .ticket-frame {
  fill: color-mix(in srgb, var(--card-color), var(--neutral-900) 78%);
}

/* A scan line sweeps across the ticket while it is being classified */
.scan {
  opacity: 0;
}

.active .ticket.active .scan {
  animation: scan var(--step-duration) linear;
}

.routed .ticket.active .scan {
  animation: none;
}

@keyframes scan {
  0% {
    opacity: 0;
    transform: translateX(0);
  }

  10%,
  85% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateX(128px);
  }
}

.ticket.exiting {
  opacity: 0;
}

.model {
  fill: var(--card-color);
  fill-opacity: 0.1;
}

.model-name {
  font-size: 13px;
  font-weight: 700;
}

/* Classifying, the dots pulse; once routed, the verdict replaces them. One fades out before the other fades in */
.thinking circle {
  animation: pulse 0.9s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.25;
  }
}

.thinking,
.verdict {
  transition: opacity 0.2s ease 0.2s;
}

.routed .thinking,
.verdict {
  opacity: 0;
  transition-delay: 0s;
}

.routed .verdict {
  opacity: 1;
  fill: var(--drawing-accent);
  transition-delay: 0.2s;
}

.routed .arm.chosen {
  stroke: var(--drawing-accent);
  stroke-width: 1.5;
}

.bin-frame {
  fill: var(--card-color);
  fill-opacity: 0;
}

.routed .bin.chosen .bin-frame {
  stroke: var(--drawing-accent);
  fill-opacity: 0.12;
}

.confidence {
  opacity: 0;
}

.routed .bin.chosen .confidence {
  opacity: 1;
}
</style>
