<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useLiveTicker } from "../../composables/useLiveTicker";
import CoverArrow from "../covers/CoverArrow.vue";

/**
 * Support tickets classified by GPT-3. Tickets queue up from above; the active
 * ticket, level with the model, is scanned and routed to a category with a
 * confidence score, then leaves to the left as the queue moves down.
 */

interface Props {
  active: boolean;
}
const props = defineProps<Props>();

const CATEGORIES = ["bug", "billing", "hardware", "feedback"] as const;
type Category = (typeof CATEGORIES)[number];

// Illustrative examples, enough to feel endless when looped; kept short to sit well inside the ticket
const TICKETS: { text: string; category: Category; confidence: number }[] = [
  { text: "App crashes on sync", category: "bug", confidence: 0.94 },
  { text: "I was charged twice", category: "billing", confidence: 0.91 },
  { text: "Sensor won't pair", category: "hardware", confidence: 0.88 },
  { text: "Love the new insights!", category: "feedback", confidence: 0.97 },
  { text: "Graph shows wrong day", category: "bug", confidence: 0.86 },
  { text: "How do I cancel?", category: "billing", confidence: 0.83 },
  { text: "Sensor fell off early", category: "hardware", confidence: 0.9 },
  { text: "Meal log won't save", category: "bug", confidence: 0.92 },
  { text: "Great tips this week", category: "feedback", confidence: 0.95 },
  { text: "Refund for last month?", category: "billing", confidence: 0.89 },
  { text: "Readings look off", category: "hardware", confidence: 0.81 },
  { text: "Login loop on update", category: "bug", confidence: 0.93 },
  { text: "Switch to yearly?", category: "billing", confidence: 0.87 },
  { text: "Coaching really helps", category: "feedback", confidence: 0.96 },
  { text: "Bluetooth drops out", category: "hardware", confidence: 0.85 },
  { text: "Notifications stopped", category: "bug", confidence: 0.84 },
  { text: "Card was declined", category: "billing", confidence: 0.9 },
  { text: "Applicator is jammed", category: "hardware", confidence: 0.88 },
  { text: "Please add dark mode", category: "feedback", confidence: 0.82 },
  { text: "Export to CSV fails", category: "bug", confidence: 0.89 },
];
/** Tickets waiting above the active one */
const QUEUE_LENGTH = 2;
/** Each ticket takes two steps: classifying, then routed */
const STEP_MS = 1100;

const MODEL = { x: 166, y: 66, width: 80, height: 76 };
const MODEL_CENTER_Y = MODEL.y + MODEL.height / 2;
/** The active ticket is level with the model, so the arrow lines up with both */
const TICKET = { x: 10, width: 136, height: 24, slot: 30 };
const ACTIVE_TICKET_Y = MODEL_CENTER_Y - TICKET.height / 2;
const BIN = { x: 272, y: 40, width: 118, height: 28, gap: 8 };
const binY = (index: number) => BIN.y + index * (BIN.height + BIN.gap);
const EXIT_OFFSET_X = -24;

const step = ref(0);
/** The ticket number being classified; grows forever, ticket text loops */
const current = computed(() => Math.floor(step.value / 2));
const isRouted = computed(() => step.value % 2 === 1);
const ticketAt = (number: number) => TICKETS[number % TICKETS.length];
const currentTicket = computed(() => ticketAt(current.value));

type TicketPosition = "exiting" | "active" | "queued";

/** The ticket that just left, the active one and the queue above it, keyed by ticket number */
const visibleTickets = computed(() =>
  Array.from({ length: QUEUE_LENGTH + 2 }, (_, index) => index - 1)
    // Before the first ticket has been processed there is no exiting ticket
    .filter((offset) => current.value + offset >= 0)
    .map((offset) => {
      const number = current.value + offset;
      const position: TicketPosition = offset < 0 ? "exiting" : offset === 0 ? "active" : "queued";
      const transform =
        position === "exiting" ? `translate(${EXIT_OFFSET_X}px, 0px)` : `translate(0px, ${-offset * TICKET.slot}px)`;
      return { number, offset, position, transform, text: ticketAt(number).text };
    }),
);

const routedCounts = ref<Record<Category, number>>({ bug: 0, billing: 0, hardware: 0, feedback: 0 });
/**
 * The latest routing result. Kept separately from the current ticket so that
 * the highlight fades out showing the ticket that was routed, not the next one.
 */
const lastResult = ref<{ category: Category; confidence: number } | null>(null);

useLiveTicker(
  toRef(props, "active"),
  () => {
    step.value++;
    if (!isRouted.value) return;
    const { category, confidence } = currentTicket.value;
    routedCounts.value[category]++;
    lastResult.value = { category, confidence };
  },
  STEP_MS,
);
</script>

<template>
  <svg class="cover" :class="{ active: props.active, routed: isRouted }" viewBox="0 0 400 220" aria-hidden="true"
    :style="{ '--step-duration': `${STEP_MS}ms` }">
    <!-- Column titles, centered over each column -->
    <text :x="TICKET.x + TICKET.width / 2" y="16" text-anchor="middle" class="cover-text label">support inbox</text>
    <text :x="MODEL.x + MODEL.width / 2" y="16" text-anchor="middle" class="cover-text label">classifier</text>
    <text :x="BIN.x + BIN.width / 2" y="16" text-anchor="middle" class="cover-text label">category · confidence</text>

    <!-- Inbox: tickets arrive from above, the active one is processed, then leaves to the left -->
    <g v-for="ticket in visibleTickets" :key="ticket.number" class="ticket" :class="ticket.position"
      :style="{ transform: ticket.transform, '--queue-opacity': 1 - ticket.offset * 0.3 }">
      <rect :x="TICKET.x" :y="ACTIVE_TICKET_Y" :width="TICKET.width" :height="TICKET.height" rx="3"
        class="cover-line ticket-frame" />
      <rect :x="TICKET.x" :y="ACTIVE_TICKET_Y + 4" width="2" :height="TICKET.height - 8" class="marker" />
      <text :x="TICKET.x + 9" :y="ACTIVE_TICKET_Y + 15" class="cover-text ticket-text">{{ ticket.text }}</text>
      <line v-if="ticket.position === 'active'" :x1="TICKET.x + 4" :y1="ACTIVE_TICKET_Y + 2" :x2="TICKET.x + 4"
        :y2="ACTIVE_TICKET_Y + TICKET.height - 2" class="cover-line accent scan" />
    </g>

    <CoverArrow :x1="TICKET.x + TICKET.width + 2" :x2="MODEL.x - 2" :y="MODEL_CENTER_Y" />

    <!-- The model -->
    <rect :x="MODEL.x" :y="MODEL.y" :width="MODEL.width" :height="MODEL.height" rx="6"
      class="cover-line accent model glow" />
    <text :x="MODEL.x + MODEL.width / 2" :y="MODEL.y + 34" text-anchor="middle" class="cover-text accent model-name">
      GPT-3</text>
    <g class="thinking">
      <circle v-for="dot in 3" :key="dot" :cx="MODEL.x + 28 + dot * 6" :cy="MODEL.y + 52" r="1.6"
        class="cover-fill accent" :style="{ animationDelay: `${dot * 0.15}s` }" />
    </g>
    <text :x="MODEL.x + MODEL.width / 2" :y="MODEL.y + 52" text-anchor="middle" class="cover-text label verdict">
      <template v-if="lastResult">{{ lastResult.category }} {{ lastResult.confidence.toFixed(2) }}</template></text>

    <!-- Every arm is always drawn; the matched one lights up once routed -->
    <path v-for="(category, index) in CATEGORIES" :key="category"
      :d="`M${MODEL.x + MODEL.width} ${MODEL_CENTER_Y} C258 ${MODEL_CENTER_Y} 258 ${binY(index) + BIN.height / 2} ${BIN.x} ${binY(index) + BIN.height / 2}`"
      class="cover-line muted arm" :class="{ chosen: category === lastResult?.category }" />

    <g v-for="(category, index) in CATEGORIES" :key="category" class="bin"
      :class="{ chosen: category === lastResult?.category }">
      <rect :x="BIN.x" :y="binY(index)" :width="BIN.width" :height="BIN.height" rx="3" class="cover-line bin-frame" />
      <text :x="BIN.x + 7" :y="binY(index) + 12" class="cover-text">{{ category }}</text>
      <text :x="BIN.x + BIN.width - 7" :y="binY(index) + 12" text-anchor="end" class="cover-text label">
        {{ routedCounts[category] }}</text>
      <rect :x="BIN.x + 7" :y="binY(index) + 18" :width="(BIN.width - 14) * (lastResult?.confidence ?? 0)" height="4"
        class="cover-fill accent confidence" />
    </g>
  </svg>
</template>

<style scoped>
.ticket {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease;
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
  animation: ticket-in 0.6s ease-out;
}

@keyframes ticket-in {
  from {
    opacity: 0;
    translate: 0 -12px;
  }
}

/* The ticket being processed */
.ticket.active .ticket-frame {
  stroke: var(--cover-accent);
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

/* Classifying: dots pulse; routed: the verdict replaces them. One fades out before the other fades in */
.thinking circle {
  animation: pulse 0.9s ease-in-out infinite;
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
  fill: var(--cover-accent);
  transition-delay: 0.2s;
}

.routed .arm.chosen {
  stroke: var(--cover-accent);
  stroke-width: 1.5;
}

.bin-frame {
  fill: var(--card-color);
  fill-opacity: 0;
}

.routed .bin.chosen .bin-frame {
  stroke: var(--cover-accent);
  fill-opacity: 0.12;
}

.confidence {
  opacity: 0;
}

.routed .bin.chosen .confidence {
  opacity: 1;
}

@keyframes pulse {
  50% {
    opacity: 0.25;
  }
}
</style>
