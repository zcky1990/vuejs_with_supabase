<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Product } from '@/types/database'

defineProps<{
  products: Product[]
}>()

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}
</script>

<template>
  <div class="w-full max-w-2xl space-y-3">
    <h2 class="text-sm font-medium text-muted-foreground">
      {{ products.length }} produk ditemukan
    </h2>
    <div class="grid gap-3">
      <Card
        v-for="product in products"
        :key="product.id"
        class="bg-background/90 backdrop-blur-sm"
      >
        <CardHeader class="pb-2">
          <CardTitle class="text-base">{{ product.name }}</CardTitle>
          <CardDescription v-if="product.description">
            {{ product.description }}
          </CardDescription>
        </CardHeader>
        <CardContent class="grid gap-1 text-sm text-muted-foreground">
          <p><span class="font-medium text-foreground">Harga:</span> {{ formatPrice(product.price) }}</p>
          <!-- <p><span class="font-medium text-foreground">Stok:</span> {{ product.stock_quantity }}</p>
          <p v-if="product.sku">
            <span class="font-medium text-foreground">SKU:</span> {{ product.sku }}
          </p> -->
        </CardContent>
      </Card>
    </div>
  </div>
</template>
