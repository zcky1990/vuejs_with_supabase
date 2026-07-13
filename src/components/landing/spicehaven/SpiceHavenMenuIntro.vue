<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { UtensilsCrossed } from '@lucide/vue'
import { useI18n } from '@/composables/useI18n'
import { landingSectionStyle } from '@/lib/landing-section-style'

const props = defineProps<{
  subtitle: string
  imageUrl: string | null
  shopName: string
  bgColor: string
  bgImage: string | null
}>()

const { t } = useI18n()
const sectionStyle = computed(() => landingSectionStyle(props.bgImage, props.bgColor))
</script>

<template>
  <section id="menu" class="landing-fade-up px-6 py-24" :style="sectionStyle">
    <div class="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
      <div>
        <p class="mb-4 text-sm font-semibold text-amber-500">
          {{ t('config.landingSpiceHavenMenuLabel') }}
        </p>
        <p class="font-serif text-2xl leading-relaxed text-amber-100/90 md:text-3xl">
          {{ subtitle }}
        </p>
        <RouterLink to="/order" class="mt-8 inline-block">
          <span class="border-b border-amber-400 pb-1 text-sm font-semibold tracking-widest text-amber-400 uppercase">
            {{ t('config.landingSpiceHavenExploreMenu') }}
          </span>
        </RouterLink>
      </div>
      <div class="relative">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="shopName"
          class="w-full rounded-sm object-cover shadow-2xl"
        />
        <div v-else class="flex aspect-[4/3] items-center justify-center bg-stone-800">
          <UtensilsCrossed class="size-16 text-stone-600" />
        </div>
      </div>
    </div>
  </section>
</template>
