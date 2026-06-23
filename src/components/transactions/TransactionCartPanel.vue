<script setup lang="ts">
import { Banknote, ClipboardList, Minus, Plus, ShoppingCart, Trash2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/format'
import { hasBundleAddons } from '@/lib/addon'
import type { CartItem } from '@/composables/useTransactionCart'

defineProps<{
  cart: CartItem[]
  totalAmount: number
  isSubmitting: boolean
  requiresImmediatePayment?: boolean
  getCartLineSubtotal: (item: CartItem) => number
}>()

const emit = defineEmits<{
  updateQuantity: [lineKey: string, quantity: number]
  remove: [lineKey: string]
  submitDebt: []
  submitDebtQueue: []
  pay: []
  payQueue: []
}>()
</script>

<template>
  <section class="space-y-4">
    <div class="rounded-xl border bg-background p-4">
      <div class="mb-4 flex items-center gap-2">
        <ShoppingCart class="size-5" />
        <h2 class="font-semibold">Keranjang</h2>
      </div>

      <div v-if="!cart.length" class="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Belum ada produk di keranjang.
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="item in cart"
          :key="item.lineKey"
          class="rounded-xl border px-4 py-3"
        >
          <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-medium">
                  {{ item.product.name }}
                  <span v-if="!hasBundleAddons(item.addons)" class="text-muted-foreground">
                    x{{ item.quantity }}
                  </span>
                </p>
                <p class="text-sm text-muted-foreground">
                  {{ formatPrice(item.product.price) }}
                  <span v-if="!hasBundleAddons(item.addons)"> / item</span>
                </p>
                <ul
                  v-if="item.addons.length"
                  class="mt-1 space-y-0.5 text-xs text-muted-foreground"
                >
                  <li
                    v-for="addon in item.addons"
                    :key="addon.product.id"
                  >
                    + {{ addon.product.name }}
                    <span v-if="addon.quantity > 1">x{{ addon.quantity }}</span>
                    ({{ formatPrice(addon.product.price * addon.quantity) }})
                  </li>
                </ul>
              </div>
            <Button
              size="icon-sm"
              variant="ghost"
              @click="emit('remove', item.lineKey)"
            >
              <Trash2 class="size-4" />
            </Button>
          </div>

          <div class="mt-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Button
                size="icon-sm"
                variant="outline"
                @click="emit('updateQuantity', item.lineKey, item.quantity - 1)"
              >
                <Minus class="size-4" />
              </Button>
              <Input
                v-if="!hasBundleAddons(item.addons)"
                :model-value="item.quantity"
                type="number"
                min="1"
                :max="item.product.stock_quantity"
                class="w-16 text-center"
                @update:model-value="emit('updateQuantity', item.lineKey, Number($event))"
              />
              <span
                v-else
                class="min-w-6 text-center text-sm font-medium tabular-nums"
              >
                1
              </span>
              <Button
                size="icon-sm"
                variant="outline"
                @click="emit('updateQuantity', item.lineKey, item.quantity + 1)"
              >
                <Plus class="size-4" />
              </Button>
            </div>
            <p class="font-semibold">
              {{ formatPrice(getCartLineSubtotal(item)) }}
            </p>
          </div>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between border-t pt-4">
        <span class="text-sm text-muted-foreground">Total</span>
        <span class="text-lg font-bold">{{ formatPrice(totalAmount) }}</span>
      </div>

      <div class="mt-4 grid gap-2 sm:grid-cols-2">
        <Button
          v-if="!requiresImmediatePayment"
          variant="outline"
          :disabled="isSubmitting || !cart.length"
          @click="emit('submitDebt')"
        >
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan Hutang' }}
        </Button>
        <Button
          v-if="!requiresImmediatePayment"
          variant="outline"
          :disabled="isSubmitting || !cart.length"
          @click="emit('submitDebtQueue')"
        >
          <ClipboardList class="size-4" />
          {{ isSubmitting ? 'Memproses...' : 'Simpan Hutang & Antrian' }}
        </Button>
        <Button
          :disabled="isSubmitting || !cart.length"
          @click="emit('pay')"
        >
          <Banknote class="size-4" />
          {{ isSubmitting ? 'Memproses...' : 'Bayar' }}
        </Button>
        <Button
          :disabled="isSubmitting || !cart.length"
          @click="emit('payQueue')"
        >
          <Banknote class="size-4" />
          <ClipboardList class="size-4" />
          {{ isSubmitting ? 'Memproses...' : 'Bayar & Antrian' }}
        </Button>
      </div>
    </div>
  </section>
</template>
