<script setup lang="ts">
import CoverArrow from "./CoverArrow.vue";

/** The compiler pipeline: source → syntax tree → assembly, flowing when active. */

interface Props {
  active: boolean;
}
const props = defineProps<Props>();

const SOURCE = ["int main() {", "  x = 1 + 2;", "}"];
const ASSEMBLY = ["movl $1, %eax", "addl $2, %eax", "movl %eax, x", "ret"];

interface TreeNode {
  label: string;
  x: number;
  y: number;
  parent?: number;
}

// Syntax tree for `x = 1 + 2`, parents listed before children
const TREE: TreeNode[] = [
  { label: "=", x: 205, y: 54 },
  { label: "x", x: 174, y: 98, parent: 0 },
  { label: "+", x: 236, y: 98, parent: 0 },
  { label: "1", x: 214, y: 142, parent: 2 },
  { label: "2", x: 258, y: 142, parent: 2 },
];
const NODE_RADIUS = 11;
const STAGGER_S = 0.15;
</script>

<template>
  <svg class="cover" :class="{ active: props.active }" viewBox="0 0 400 200" aria-hidden="true">
    <!-- Source -->
    <text x="10" y="22" class="cover-text label">source.c</text>
    <rect x="10" y="32" width="105" height="120" rx="3" class="cover-line" />
    <text v-for="(line, index) in SOURCE" :key="index" x="18" :y="56 + index * 16" class="cover-text source-line">{{ line }}</text>

    <CoverArrow :x1="121" :x2="146" :y="92" />

    <!-- Syntax tree -->
    <text x="160" y="22" class="cover-text label">ast</text>
    <template v-for="(node, index) in TREE" :key="index">
      <line v-if="node.parent !== undefined" :x1="TREE[node.parent].x" :y1="TREE[node.parent].y + NODE_RADIUS"
        :x2="node.x" :y2="node.y - NODE_RADIUS" class="cover-line tree-part"
        :style="{ transitionDelay: props.active ? `${index * STAGGER_S}s` : '0s' }" />
    </template>
    <g v-for="(node, index) in TREE" :key="node.label" class="tree-part"
      :style="{ transitionDelay: props.active ? `${index * STAGGER_S}s` : '0s' }">
      <circle :cx="node.x" :cy="node.y" :r="NODE_RADIUS" class="cover-line node" />
      <text :x="node.x" :y="node.y + 3" text-anchor="middle" class="cover-text">{{ node.label }}</text>
    </g>

    <CoverArrow :x1="271" :x2="290" :y="92" />

    <!-- Assembly -->
    <text x="295" y="22" class="cover-text label">asm</text>
    <rect x="295" y="32" width="97" height="120" rx="3" class="cover-line" />
    <text v-for="(line, index) in ASSEMBLY" :key="line" x="302" :y="56 + index * 16"
      class="cover-text asm-line" :style="{ transitionDelay: props.active ? `${(TREE.length + index) * STAGGER_S}s` : '0s' }">
      {{ line }}</text>
  </svg>
</template>

<style scoped>
.source-line {
  white-space: pre;
}

.node {
  fill: var(--card-color);
  fill-opacity: 0;
}

.active .tree-part,
.active .tree-part .node {
  stroke: var(--cover-accent);
}

.active .tree-part .node {
  fill-opacity: 0.15;
}

.active .tree-part text,
.active .asm-line {
  fill: var(--cover-accent);
}
</style>
