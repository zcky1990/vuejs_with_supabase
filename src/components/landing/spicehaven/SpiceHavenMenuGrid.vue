<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ImageIcon } from '@lucide/vue'
import { useI18n } from '@/composables/useI18n'
import { formatPrice } from '@/lib/format'
import { landingSectionStyle } from '@/lib/landing-section-style'
import type { Product } from '@/types/database'

const props = defineProps<{
  products: Product[]
  maxItems: number
  title: string | null
  accentColor: string
  bgColor: string
  bgImage: string | null
}>()

const { t } = useI18n()
const sectionStyle = computed(() => landingSectionStyle(props.bgImage, props.bgColor))
const items = computed(() => props.products.slice(0, props.maxItems))
</script>

<template>
  <section class="landing-fade-up px-6 py-20" :style="sectionStyle">
    <div class="mx-auto max-w-6xl">
      <p class="mb-10 text-center text-sm text-amber-500">
        {{ title || t('config.landingSpiceHavenMenuLabel') }}
      </p>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink
          v-for="(product, idx) in items"
          :key="product.id"
          to="/order"
          class="landing-stagger group border border-amber-900/20 bg-stone-900/50 transition-colors hover:border-amber-500/40 hover:-translate-y-0.5"
          :style="{ '--i': idx }">
          <div class="relative h-48 overflow-hidden bg-stone-800">
            <img
              v-if="product.image_url"
              :src="product.image_url"
              :alt="product.name"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div v-else class="flex h-full items-center justify-center">
              <ImageIcon class="size-10 text-stone-600" />
            </div>
          </div>
          <div class="p-5 text-center">
            <h3 class="mb-1 font-serif text-lg text-amber-50">{{ product.name }}</h3>
            <p v-if="product.description" class="mb-2 line-clamp-2 text-sm text-amber-100/50">
              {{ product.description }}
            </p>
            <p class="text-sm font-semibold tracking-widest text-amber-400 uppercase">
              {{ formatPrice(product.price) }}
            </p>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
