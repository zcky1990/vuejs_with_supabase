<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/composables/useI18n'

defineProps<{
  shopName: string
  accentColor: string
  navLogoUrl?: string | null
}>()

const { t } = useI18n()

const links = [
  { href: '#hero', label: 'config.landingAppleNavHome' },
  { href: '#about', label: 'config.landingAppleNavAbout' },
  { href: '#features', label: 'config.landingAppleNavFeatures' },
  { href: '#menu', label: 'config.landingAppleNavMenu' },
  { href: '#contact', label: 'config.landingAppleNavContact' },
] as const
</script>

<template>
  <header class="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
      <RouterLink to="/" class="flex items-center gap-2 text-sm font-semibold tracking-tight text-white/90">
        <img v-if="navLogoUrl" :src="navLogoUrl" alt="Logo" class="h-5 w-auto object-contain">
        <span>{{ shopName }}</span>
      </RouterLink>
      <nav class="hidden items-center gap-8 md:flex">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="text-xs font-medium tracking-wide text-white/60 transition-colors hover:text-white/90"
        >
          {{ t(link.label) }}
        </a>
      </nav>
      <RouterLink to="/order">
        <Button size="sm" class="h-8 rounded-full bg-white px-5 text-xs font-semibold text-black hover:bg-white/90">
          {{ t('nav.createTransaction') }}
        </Button>
      </RouterLink>
    </div>
  </header>
</template>
