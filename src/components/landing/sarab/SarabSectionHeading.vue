<script setup lang="ts">
defineProps<{
  label: string
  title: string
  light?: boolean
}>()
</script>

<template>
  <div class="landing-fade-up mb-10 text-center">
    <p
      class="mb-2 text-sm font-semibold"
      :class="light ? 'text-orange-300' : 'text-orange-400'"
    >
      {{ label }}
    </p>
    <h2
      class="text-3xl font-extrabold tracking-tight md:text-4xl"
      :class="light ? 'text-white' : 'text-white'"
    >
      {{ title }}
    </h2>
  </div>
</template>
