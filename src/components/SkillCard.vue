<script setup lang="ts">

interface Props {
    upperText: string
    lowerText: string
}

const props = defineProps<Props>()
</script>

<template>
    <div class="flex flex-col gap-2 p-8 border-2 border-accent-500/50 text-accent-500/50 items-center justify-center uppercase tracking-[3px] rounded-2xl w-full h-full text-3xl bg-linear-to-br from-neutral-900 to-neutral-950 ">
        <span>{{ upperText }}</span>
        <span>{{ lowerText }}</span>
    </div>
</template>