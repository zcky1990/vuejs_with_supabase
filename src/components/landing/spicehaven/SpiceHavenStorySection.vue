<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { landingSectionStyle } from '@/lib/landing-section-style'
import type { LandingFeatureItem } from '@/types/database'

const props = defineProps<{
  label: string | null
  title: string | null
  description: string | null
  features: LandingFeatureItem[]
  bgColor: string
  bgImage: string | null
}>()

const { t } = useI18n()
const sectionStyle = computed(() => landingSectionStyle(props.bgImage, props.bgColor))
</script>

<template>
  <section id="story" class="landing-fade-up border-y border-amber-900/30 px-6 py-20" :style="sectionStyle">
    <div class="mx-auto max-w-4xl text-center">
      <p class="mb-2 text-sm text-amber-500">
        {{ label || t('config.landingSpiceHavenStory') }}
      </p>
      <h2 class="mb-6 font-serif text-3xl text-amber-50 md:text-4xl">
        {{ title || t('config.landingSpiceHavenStoryTitle') }}
      </h2>
      <p v-if="description" class="mb-12 text-amber-100/60">{{ description }}</p>
      <div class="grid gap-8 sm:grid-cols-3">
        <div v-for="(feat, idx) in features" :key="feat.title" class="landing-stagger" :style="{ '--i': idx }">
          <h3 class="mb-2 font-semibold text-amber-300">{{ feat.title }}</h3>
          <p class="text-sm text-amber-100/60">{{ feat.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
