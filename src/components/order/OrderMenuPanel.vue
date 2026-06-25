<script setup lang="ts">
import { ImageIcon, Minus, Plus, Search } from '@lucide/vue'
import MenuCategoryFilter from '@/components/menu/MenuCategoryFilter.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/composables/useI18n'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/types/database'

defineProps<{
  products: Product[]
  categories: { id: string, name: string }[]
  categoryFilter: string
  searchQuery: string
  isLoading: boolean
  getMenuQuantity: (productId: string) => number
}>()

const { t } = useI18n()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:categoryFilter': [value: string]
  add: [product: Product]
  incrementQuantity: [productId: string, maxStock: number]
  decrementQuantity: [productId: string]
}>()
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-xl font-semibold tracking-tight">{{ t('order.menu') }}</h2>
      <div class="relative w-full sm:max-w-xs">
        <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          :model-value="searchQuery"
          :placeholder="t('order.searchMenu')"
          class="pl-9"
          @update:model-value="emit('update:searchQuery', String($event))"
        />
      </div>
    </div>

    <MenuCategoryFilter
      :categories="categories"
      :category-filter="categoryFilter"
      @update:category-filter="emit('update:categoryFilter', $event)"
    />

    <div v-if="isLoading" class="py-16 text-center text-sm text-muted-foreground">
      {{ t('order.loadingMenu') }}
    </div>

    <div
      v-else-if="!products.length"
      class="rounded-xl border border-dashed px-4 py-16 text-center text-sm text-muted-foreground"
    >
      {{ t('order.noMenu') }}
    </div>

    <div
      v-else
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    >
      <Card
        v-for="product in products"
        :key="product.id"
        class="gap-0 overflow-hidden py-0"
      >
        <div class="relative aspect-[4/3] bg-muted/40">
          <img
            v-if="product.image_url"
            :src="product.image_url"
            :alt="product.name"
            class="size-full object-cover"
          >
          <div
            v-else
            class="flex size-full items-center justify-center text-muted-foreground"
          >
            <ImageIcon class="size-10 opacity-40" />
          </div>
          <span
            v-if="product.product_categories?.name"
            class="absolute top-3 left-3 rounded-full border bg-background/90 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm"
          >
            {{ product.product_categories.name }}
          </span>
        </div>

        <CardContent class="space-y-1 px-4 pt-4">
          <p class="line-clamp-2 font-semibold leading-snug">{{ product.name }}</p>
          <p class="text-sm text-muted-foreground">
            {{ formatPrice(product.price) }}
            <span class="text-xs">{{ t('order.perServing') }}</span>
          </p>
        </CardContent>

        <CardFooter class="flex items-center justify-between gap-2 px-4 pb-4">
          <div class="flex items-center gap-1 rounded-lg border bg-background p-1">
            <Button
              size="icon-sm"
              variant="ghost"
              class="size-7"
              @click="emit('decrementQuantity', product.id)"
            >
              <Minus class="size-3.5" />
            </Button>
            <span class="min-w-6 text-center text-sm font-medium tabular-nums">
              {{ getMenuQuantity(product.id) }}
            </span>
            <Button
              size="icon-sm"
              variant="ghost"
              class="size-7"
              :disabled="getMenuQuantity(product.id) >= product.stock_quantity"
              @click="emit('incrementQuantity', product.id, product.stock_quantity)"
            >
              <Plus class="size-3.5" />
            </Button>
          </div>
          <Button size="sm" class="shrink-0" @click="emit('add', product)">
            {{ t('common.add') }}
          </Button>
        </CardFooter>
      </Card>
    </div>
  </section>
</template>
