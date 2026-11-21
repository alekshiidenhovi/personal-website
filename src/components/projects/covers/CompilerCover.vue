<script setup lang="ts">
import FlowArrow from '../../ui/FlowArrow.vue';
import { getStaggeredTransition } from './stagger';

/** The compiler pipeline, from source to syntax tree to assembly, lighting up in order while active. */
interface Props {
  /** Whether the cover plays. */
  active: boolean;
}
const props = defineProps<Props>();

/** A node of the syntax tree. */
interface TreeNode {
  readonly label: string;
  readonly x: number;
  readonly y: number;
  /** The index of the node's parent, listed before it; undefined for the root. */
  readonly parent?: number;
}

const SOURCE = ['int main() {', '  x = 1 + 2;', '}'];
const ASSEMBLY = ['movl $1, %eax', 'addl $2, %eax', 'movl %eax, x', 'ret'];
/** The syntax tree of `x = 1 + 2`. */
const TREE: readonly TreeNode[] = [
  { label: '=', x: 205, y: 54 },
  { label: 'x', x: 174, y: 98, parent: 0 },
  { label: '+', x: 236, y: 98, parent: 0 },
  { label: '1', x: 214, y: 142, parent: 2 },
  { label: '2', x: 258, y: 142, parent: 2 },
];
const NODE_RADIUS = 11;
const STAGGER_S = 0.15;
</script>

<template>
  <svg class="drawing" :class="{ active: props.active }" viewBox="0 0 400 200" aria-hidden="true">
    <text x="10" y="22" class="drawing-text label">source.c</text>
    <rect x="10" y="32" width="105" height="120" rx="3" class="drawing-line" />
    <text v-for="(line, index) in SOURCE" :key="index" x="18" :y="56 + index * 16" class="drawing-text source-line">{{
      line }}</text>

    <FlowArrow :x1="121" :x2="146" :y="92" />

    <text x="160" y="22" class="drawing-text label">ast</text>
    <template v-for="(node, index) in TREE" :key="index">
      <line v-if="node.parent !== undefined" :x1="TREE[node.parent].x" :y1="TREE[node.parent].y + NODE_RADIUS"
        :x2="node.x" :y2="node.y - NODE_RADIUS" class="drawing-line tree-part"
        :style="getStaggeredTransition(props.active, index, STAGGER_S)" />
    </template>
    <g v-for="(node, index) in TREE" :key="node.label" class="tree-part"
      :style="getStaggeredTransition(props.active, index, STAGGER_S)">
      <circle :cx="node.x" :cy="node.y" :r="NODE_RADIUS" class="drawing-line node" />
      <text :x="node.x" :y="node.y + 3" text-anchor="middle" class="drawing-text">{{ node.label }}</text>
    </g>

    <FlowArrow :x1="271" :x2="290" :y="92" />

    <text x="295" y="22" class="drawing-text label">asm</text>
    <rect x="295" y="32" width="97" height="120" rx="3" class="drawing-line" />
    <text v-for="(line, index) in ASSEMBLY" :key="line" x="302" :y="56 + index * 16" class="drawing-text asm-line"
      :style="getStaggeredTransition(props.active, TREE.length + index, STAGGER_S)">{{ line }}</text>
  </svg>
</template>

<style scoped>
/* Keeps the source's indentation */
.source-line {
  white-space: pre;
}

.node {
  fill: var(--card-color);
  fill-opacity: 0;
}

.active .tree-part,
.active .tree-part .node {
  stroke: var(--drawing-accent);
}

.active .tree-part .node {
  fill-opacity: 0.15;
}

.active .tree-part text,
.active .asm-line {
  fill: var(--drawing-accent);
}
</style>
