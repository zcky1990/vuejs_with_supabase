<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from '@/composables/useI18n'

defineProps<{
  shopName: string
  accentColor: string
  navLogoUrl?: string | null
}>()

const { t } = useI18n()
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-40 bg-stone-950/80 backdrop-blur-md px-6 py-6">
    <div class="mx-auto flex max-w-6xl items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-2 font-serif text-xl font-semibold text-amber-50">
        <img v-if="navLogoUrl" :src="navLogoUrl" alt="Logo" class="h-7 w-auto object-contain">
        <span>{{ shopName }}</span>
      </RouterLink>
      <nav class="hidden items-center gap-8 md:flex">
        <a href="#hero" class="text-sm text-amber-100/70 hover:text-amber-300">{{ t('config.landingSpiceHavenNavHome') }}</a>
        <a href="#menu" class="text-sm text-amber-100/70 hover:text-amber-300">{{ t('config.landingSpiceHavenNavMenu') }}</a>
        <a href="#story" class="text-sm text-amber-100/70 hover:text-amber-300">{{ t('config.landingSpiceHavenNavStory') }}</a>
        <a href="#moments" class="text-sm text-amber-100/70 hover:text-amber-300">{{ t('config.landingSpiceHavenNavGallery') }}</a>
        <a href="#contact" class="text-sm text-amber-100/70 hover:text-amber-300">{{ t('config.landingSpiceHavenNavContact') }}</a>
      </nav>
      <RouterLink
        to="/order"
        class="border border-amber-400/40 px-4 py-2 text-sm font-semibold text-amber-50 transition-colors hover:bg-amber-400/10"
      >
        {{ t('config.landingSpiceHavenOrder') }}
      </RouterLink>
    </div>
  </header>
</template>
