<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useLiveTicker } from "../composables/useLiveTicker";
import { type CpuState, assemble } from "../lib/hack";

/**
 * A HACK CPU executing a countdown loop, one instruction per tick.
 * Hovering pauses execution and decodes the hovered instruction to machine code.
 */

const PROGRAM = [
  { code: "@5", comment: "A = 5" },
  { code: "D=A" },
  { code: "@i" },
  { code: "M=D", comment: "i = 5" },
  { code: "(LOOP)" },
  { code: "@i" },
  { code: "D=M" },
  { code: "@END" },
  { code: "D;JEQ", comment: "if i == 0 goto END" },
  { code: "@i" },
  { code: "M=M-1", comment: "i--" },
  { code: "@LOOP" },
  { code: "0;JMP", comment: "goto LOOP" },
  { code: "(END)" },
  { code: "@END" },
  { code: "0;JMP", comment: "halt" },
];

const TICK_MS = 380;
const HALT_TICKS = 8;
const VISIBLE_ROWS = 7;
const ROW_HEIGHT_REM = 1.5;

const { instructions, listing, symbols } = assemble(PROGRAM.map((line) => line.code));
const VARIABLE_ADDRESS = symbols.i;
const HALT_ADDRESS = symbols.END;

const createInitialState = (): CpuState => ({ pc: 0, a: 0, d: 0, ram: {} });

interface Props {
  /** Whether the visual is playing */
  active: boolean;
}
const props = defineProps<Props>();

const state = ref(createInitialState());
const cycle = ref(0);
const hoveredAddress = ref<number | null>(null);
let haltTicks = 0;

const isHalted = computed(() => state.value.pc === HALT_ADDRESS);

useLiveTicker(
  toRef(props, "active"),
  () => {
    // Hovering an instruction acts as a breakpoint
    if (hoveredAddress.value !== null) return;
    if (isHalted.value) {
      haltTicks++;
      if (haltTicks < HALT_TICKS) return;
      haltTicks = 0;
      cycle.value = 0;
      state.value = createInitialState();
      return;
    }
    state.value = instructions[state.value.pc].execute(state.value);
    cycle.value++;
  },
  TICK_MS,
);

const status = computed(() => {
  if (!props.active) return "idle";
  if (hoveredAddress.value !== null) return "paused";
  return isHalted.value ? "halted" : "running";
});

const currentRow = computed(() => listing.findIndex((row) => row.address === state.value.pc));
const scrollOffset = computed(() =>
  Math.min(Math.max(currentRow.value - Math.floor(VISIBLE_ROWS / 2), 0), listing.length - VISIBLE_ROWS),
);
const decoded = computed(() => instructions[hoveredAddress.value ?? state.value.pc]);

const registers = computed(() => [
  { name: "PC", value: state.value.pc },
  { name: "A", value: state.value.a },
  { name: "D", value: state.value.d },
  { name: `RAM[${VARIABLE_ADDRESS}]`, hint: "i", value: state.value.ram[VARIABLE_ADDRESS] ?? 0 },
]);
</script>

<template>
  <div class="visual">
    <div class="header">
      <span class="status" :class="status">{{ status }}</span>
      <span>cycle {{ String(cycle).padStart(3, "0") }}</span>
    </div>

    <div class="machine">
      <div class="listing" @pointerleave="hoveredAddress = null" :style="{ height: `${VISIBLE_ROWS * ROW_HEIGHT_REM}rem` }">
        <ol :style="{ transform: `translateY(-${scrollOffset * ROW_HEIGHT_REM}rem)` }">
          <li v-for="(row, index) in listing" :key="index" class="row" :class="{
            label: row.address === null,
            current: row.address === state.pc,
            inspected: row.address !== null && row.address === hoveredAddress,
          }" :style="{ height: `${ROW_HEIGHT_REM}rem` }" @pointerenter="hoveredAddress = row.address">
            <span class="address">{{ row.address ?? "" }}</span>
            <span class="code">{{ row.source }}</span>
            <span v-if="PROGRAM[index].comment" class="comment">// {{ PROGRAM[index].comment }}</span>
          </li>
        </ol>
      </div>

      <dl class="registers">
        <div v-for="register in registers" :key="register.name" class="register">
          <dt>{{ register.name }}<span v-if="register.hint" class="hint"> {{ register.hint }}</span></dt>
          <dd :key="register.value" class="value">{{ register.value }}</dd>
        </div>
      </dl>
    </div>

    <div class="decoder">
      <span class="decoder-title">ROM[{{ decoded.address }}] <span class="decoder-source">{{ decoded.source }}</span></span>
      <div class="bits">
        <span v-for="segment in decoded.segments" :key="segment.label" class="segment" :class="`segment-${segment.label}`">
          <span class="segment-bits">{{ segment.bits }}</span>
          <span class="segment-label">{{ segment.label }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.visual {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  width: 100%;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--neutral-500);
}

.header {
  display: flex;
  justify-content: space-between;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--accent-300);
}

.status::before {
  content: "";
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse 0.76s steps(2, start) infinite;
}

.status.paused {
  color: var(--warning-400);
}

.status.halted,
.status.idle {
  color: var(--neutral-400);
}

.status.paused::before,
.status.halted::before,
.status.idle::before {
  animation: none;
}

@keyframes pulse {
  to {
    opacity: 0.25;
  }
}

.machine {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
}

.listing {
  overflow: hidden;
  border: 1px solid var(--neutral-800);
  background-color: color-mix(in srgb, var(--neutral-950), transparent 40%);
  mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
}

ol {
  list-style: none;
  transition: transform 0.3s ease;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0.75rem;
  white-space: nowrap;
  border-left: 2px solid transparent;
  cursor: default;
}

.address {
  width: 1.25rem;
  text-align: right;
  color: var(--neutral-600);
}

.code {
  color: var(--neutral-200);
}

.label .code {
  color: var(--warning-400);
}

.comment {
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--neutral-600);
}

.row.current {
  border-left-color: var(--accent-400);
  background-color: color-mix(in srgb, var(--accent-500), transparent 82%);
}

.row.current .code {
  color: var(--accent-200);
}

.row.inspected {
  background-color: color-mix(in srgb, var(--neutral-500), transparent 80%);
}

.registers {
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  gap: 1px;
  min-width: 6.5rem;
  border: 1px solid var(--neutral-800);
  background-color: var(--neutral-800);
}

.register {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.125rem;
  padding: 0.25rem 0.625rem;
  background-color: var(--neutral-900);
}

dt {
  font-size: 0.625rem;
  letter-spacing: 1px;
}

.hint {
  color: var(--neutral-600);
}

.value {
  font-size: 0.9375rem;
  color: var(--neutral-100);
  animation: flash 0.5s ease-out;
}

@keyframes flash {
  from {
    color: var(--accent-300);
    text-shadow: 0 0 0.75rem var(--accent-400);
  }
}

.decoder {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  padding: 0.625rem 0.75rem;
  border: 1px dashed var(--neutral-700);
}

.decoder-source {
  color: var(--neutral-200);
}

.bits {
  display: flex;
  gap: 0.5rem;
}

.segment {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.segment-bits {
  font-size: 0.875rem;
  letter-spacing: 1px;
}

.segment-label {
  font-size: 0.5625rem;
  text-transform: uppercase;
  color: var(--neutral-600);
}

.segment-op .segment-bits {
  color: var(--accent-400);
}

.segment-a .segment-bits,
.segment-value .segment-bits {
  color: var(--neutral-200);
}

.segment-comp .segment-bits {
  color: var(--primary-300);
}

.segment-dest .segment-bits {
  color: var(--warning-300);
}

.segment-jump .segment-bits {
  color: var(--success-400);
}
</style>
