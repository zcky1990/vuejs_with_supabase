<script setup lang="ts">
import { Minus, Plus, Trash2 } from '@lucide/vue'
import OrderCustomerForm from '@/components/order/OrderCustomerForm.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/format'
import { hasBundleAddons } from '@/lib/addon'
import type { PreOrderCartItem } from '@/composables/usePreOrderCart'

defineProps<{
  cart: PreOrderCartItem[]
  totalAmount: number
  isSubmitting: boolean
  getCartLineSubtotal: (item: PreOrderCartItem) => number
}>()

const customerName = defineModel<string>('customerName', { required: true })
const tableNumber = defineModel<string>('tableNumber', { required: true })
const notes = defineModel<string>('notes', { required: true })

const emit = defineEmits<{
  updateQuantity: [lineKey: string, quantity: number]
  remove: [lineKey: string]
  clear: []
  submit: []
}>()
</script>

<template>
  <aside class="lg:sticky lg:top-20 lg:self-start">
    <Card class="gap-0 py-0 shadow-sm">
      <CardHeader class="border-b px-5 py-4">
        <CardTitle class="text-lg">Ringkasan Pesanan</CardTitle>
      </CardHeader>

      <CardContent class="space-y-5 px-5 py-5">
        <OrderCustomerForm
          v-model:customer-name="customerName"
          v-model:table-number="tableNumber"
          v-model:notes="notes"
        />

        <Separator />

        <div class="flex items-center justify-between">
          <p class="text-sm font-medium">Item Pesanan</p>
          <Button
            v-if="cart.length"
            variant="ghost"
            size="sm"
            class="h-8 text-destructive hover:text-destructive"
            @click="emit('clear')"
          >
            <Trash2 class="size-3.5" />
            Kosongkan
          </Button>
        </div>

        <div
          v-if="!cart.length"
          class="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground"
        >
          Belum ada item. Pilih menu untuk memulai pesanan.
        </div>

        <div v-else class="max-h-[320px] space-y-3 overflow-y-auto pr-1">
          <div
            v-for="item in cart"
            :key="item.lineKey"
            class="flex gap-3 rounded-lg border p-3"
          >
            <div class="size-14 shrink-0 overflow-hidden rounded-md bg-muted/40">
              <img
                v-if="item.product.image_url"
                :src="item.product.image_url"
                :alt="item.product.name"
                class="size-full object-cover"
              >
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-medium leading-snug">
                  {{ item.product.name }}
                  <span v-if="!hasBundleAddons(item.addons)" class="text-muted-foreground">
                    x{{ item.quantity }}
                  </span>
                </p>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  class="size-7 shrink-0"
                  @click="emit('remove', item.lineKey)"
                >
                  <Trash2 class="size-3.5" />
                </Button>
              </div>

              <ul v-if="item.addons.length" class="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                <li
                  v-for="addon in item.addons"
                  :key="addon.product.id"
                >
                  • {{ addon.product.name }}
                  <span v-if="addon.quantity > 1">x{{ addon.quantity }}</span>
                  (+{{ formatPrice(addon.product.price * addon.quantity) }})
                </li>
              </ul>

              <div class="mt-2 flex items-center justify-between gap-2">
                <div class="flex items-center gap-1 rounded-md border p-0.5">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    class="size-6"
                    @click="emit('updateQuantity', item.lineKey, item.quantity - 1)"
                  >
                    <Minus class="size-3" />
                  </Button>
                  <span class="min-w-5 text-center text-xs font-medium tabular-nums">
                    {{ hasBundleAddons(item.addons) ? 1 : item.quantity }}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    class="size-6"
                    @click="emit('updateQuantity', item.lineKey, item.quantity + 1)"
                  >
                    <Plus class="size-3" />
                  </Button>
                </div>
                <p class="text-sm font-semibold">
                  {{ formatPrice(getCartLineSubtotal(item)) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{{ formatPrice(totalAmount) }}</span>
          </div>
          <div class="flex items-center justify-between text-base font-bold">
            <span>Total</span>
            <span>{{ formatPrice(totalAmount) }}</span>
          </div>
        </div>

        <Button
          class="h-11 w-full text-base"
          :disabled="isSubmitting || !cart.length"
          @click="emit('submit')"
        >
          {{ isSubmitting ? 'Membuat pesanan...' : 'Buat Pesanan' }}
        </Button>

        <p class="text-center text-xs text-muted-foreground">
          Setelah pesanan dibuat, silakan menuju kasir untuk pembayaran.
        </p>
      </CardContent>
    </Card>
  </aside>
</template>
