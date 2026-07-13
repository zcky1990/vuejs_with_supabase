<script setup lang="ts">
defineProps<{
  label: string
  title: string
  accentColor: string
  light?: boolean
}>()
</script>

<template>
  <div class="landing-fade-up mb-10 text-center">
    <p
      class="yummy-section-label mb-2 text-sm font-semibold"
      :class="light ? 'text-white/70' : 'text-slate-500'"
      :style="!light ? { color: accentColor } : undefined"
    >
      {{ label }}
    </p>
    <h2
      class="yummy-font-display relative inline-block pb-3 text-3xl font-bold md:text-4xl"
      :class="light ? 'text-white' : 'text-slate-800'"
    >
      {{ title }}
      <span
        class="absolute bottom-0 left-1/2 h-0.5 w-16 -translate-x-1/2 rounded-full"
        :style="{ backgroundColor: accentColor }"
      />
    </h2>
  </div>
</template>

<style scoped>
.yummy-font-display {
  font-family: 'Amatic SC', cursive;
  letter-spacing: 0.02em;
}
</style>
