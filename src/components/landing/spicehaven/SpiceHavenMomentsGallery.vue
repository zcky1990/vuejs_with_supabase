<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { landingSectionStyle } from '@/lib/landing-section-style'

const props = defineProps<{
  images: string[]
  title: string | null
  subtitle: string | null
  bgColor: string
  bgImage: string | null
}>()

const { t } = useI18n()
const sectionStyle = computed(() => landingSectionStyle(props.bgImage, props.bgColor))
</script>

<template>
  <section id="moments" class="landing-fade-up px-6 py-20" :style="sectionStyle">
    <div class="mx-auto max-w-6xl text-center">
      <p class="mb-2 text-sm text-amber-500">
        {{ t('config.landingSpiceHavenMoments') }}
      </p>
      <h2 class="mb-3 font-serif text-3xl text-amber-50">
        {{ title || t('config.landingSpiceHavenFollowUs') }}
      </h2>
      <p v-if="subtitle" class="mb-10 text-sm text-amber-100/50">{{ subtitle }}</p>
      <div class="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        <div
          v-for="(url, idx) in images"
          :key="idx"
          class="landing-stagger group relative aspect-square overflow-hidden bg-stone-800"
          :style="{ '--i': idx }">
          <img
            :src="url"
            :alt="`Moment ${idx + 1}`"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      </div>
      <p v-if="images.length === 0" class="py-8 text-sm text-amber-100/40">{{ t('config.landingGalleryEmpty') }}</p>
    </div>
  </section>
</template>
