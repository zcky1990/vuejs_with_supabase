<script setup lang="ts">
import { computed } from 'vue'
import LandingDefaultPage from '@/components/landing/templates/LandingDefaultPage.vue'
import LandingYummyPage from '@/components/landing/templates/LandingYummyPage.vue'
import LandingSarabPage from '@/components/landing/templates/LandingSarabPage.vue'
import LandingSpiceHavenPage from '@/components/landing/templates/LandingSpiceHavenPage.vue'
import LandingApplePage from '@/components/landing/templates/LandingApplePage.vue'
import { getLandingThemeAttrs } from '@/lib/landing-theme'
import { useLandingGsap } from '@/composables/useLandingGsap'
import type { LandingPageProps } from '@/components/landing/landing-page-props'
import type { LandingTemplate } from '@/types/database'

const props = defineProps<LandingPageProps>()

const templateComponents: Record<LandingTemplate, typeof LandingDefaultPage> = {
  default: LandingDefaultPage,
  yummy: LandingYummyPage,
  sarab: LandingSarabPage,
  spicehaven: LandingSpiceHavenPage,
  apple: LandingApplePage,
}

const activeComponent = computed(() => templateComponents[props.template] ?? LandingDefaultPage)
const themeAttrs = computed(() => getLandingThemeAttrs(props.template))

useLandingGsap()
</script>

<template>
  <div class="landing-root min-h-screen w-full" :class="themeAttrs.class" :style="themeAttrs.style">
    <component :is="activeComponent" v-bind="props" />
  </div>
</template>
