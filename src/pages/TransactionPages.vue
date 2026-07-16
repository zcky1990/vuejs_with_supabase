<script setup lang="ts">
import { ref } from 'vue'
import {
  Banknote,
  ClipboardList,
  Minus,
  Plus,
  Receipt,
  ShoppingCart,
  Trash2,
} from '@lucide/vue'
import AddonSelectDialog from '@/components/transactions/AddonSelectDialog.vue'
import PaymentMethodDialog from '@/components/transactions/PaymentMethodDialog.vue'
import PaymentSuccessDialog from '@/components/transactions/PaymentSuccessDialog.vue'
import TableNumberDialog from '@/components/transactions/TableNumberDialog.vue'
import OrderMenuPanel from '@/components/order/OrderMenuPanel.vue'
import TableSelect from '@/components/tables/TableSelect.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useTransactionCart } from '@/composables/useTransactionCart'
import { useI18n } from '@/composables/useI18n'
import { formatPrice } from '@/lib/format'
import { hasBundleAddons } from '@/lib/addon'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { WALK_IN_CUSTOMER_NAME } from '@/types/database'

const { t } = useI18n()

const {
  customers,
  selectedCustomerId,
  selectedCustomer,
  requiresImmediatePayment,
  allowPayFirst,
  allowEatFirst,
  tableNumber,
  notes,
  categoryFilter,
  menuCategories,
  filteredProducts,
  cart,
  pendingTransaction,
  isLoading,
  isSubmitting,
  paymentDialogOpen,
  tableDialogOpen,
  addonDialogOpen,
  pendingProduct,
  pendingProductAddons,
  pendingBundleIndex,
  pendingBundleTotal,
  paymentSuccessDialogOpen,
  paymentSuccessInvoice,
  totalAmount,
  getCartLineSubtotal,
  handleAddSelectedProduct,
  handleAddonConfirm,
  updateQuantity,
  removeFromCart,
  handleSubmit,
  openQueueFlow,
  handleTableNumberConfirm,
  openPaymentDialog,
  handlePayment,
  selectedProductId,
  addQuantity,
} = useTransactionCart()

function displayCustomerName(name: string) {
  if (name === WALK_IN_CUSTOMER_NAME) return `${t('common.walkIn')}${t('common.defaultSuffix')}`
  return name
}

const searchQuery = ref('')

function getMenuQuantity(productId: string) {
  const item = cart.value.find((c) => c.product.id === productId || c.lineKey === productId)
  return item?.quantity ?? 0
}

function addProductFromMenu(product: { id: string }) {
  selectedProductId.value = product.id
  addQuantity.value = 1
  handleAddSelectedProduct()
}
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6 p-6">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Receipt class="size-6" />
          {{ t('transaction.title') }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t('transaction.subtitle') }}
        </p>
      </div>

      <div
        v-if="pendingTransaction && !requiresImmediatePayment"
        class="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm"
      >
        <p class="font-medium text-foreground">{{ t('transaction.pendingBanner') }}</p>
        <p class="text-muted-foreground">
          {{ t('transaction.pendingHint') }}
          <span class="font-medium text-foreground">{{ formatPrice(pendingTransaction.total_amount) }}</span>.
        </p>
      </div>

      <div v-if="isLoading" class="text-sm text-muted-foreground">
        {{ t('common.loading') }}
      </div>

      <div v-else class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <OrderMenuPanel
          :products="filteredProducts"
          :categories="menuCategories"
          :category-filter="categoryFilter"
          :search-query="searchQuery"
          :is-loading="isLoading"
          :get-menu-quantity="getMenuQuantity"
          @update:search-query="searchQuery = $event"
          @update:category-filter="categoryFilter = $event"
          @add="addProductFromMenu"
          @increment-quantity="(id: string) => addProductFromMenu({ id })"
          @decrement-quantity="(id: string) => updateQuantity(id, Math.max(0, getMenuQuantity(id) - 1))"
        />

        <aside class="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          <Card class="gap-0 py-0 shadow-sm">
            <CardContent class="space-y-4 px-5 py-5">
              <FieldGroup class="gap-4">
                <Field>
                  <FieldLabel for="tx-customer">{{ t('transaction.buyerLabel') }}</FieldLabel>
                  <Select v-model="selectedCustomerId">
                    <SelectTrigger id="tx-customer" class="w-full">
                      <SelectValue :placeholder="t('transaction.buyerLabel')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="c in customers"
                        :key="c.id"
                        :value="c.id"
                      >
                        {{ displayCustomerName(c.name) }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel for="tx-table">{{ t('common.table') }}</FieldLabel>
                  <TableSelect
                    id="tx-table"
                    v-model="tableNumber"
                    :placeholder="t('common.optional')"
                  />
                </Field>

                <Field>
                  <FieldLabel for="tx-notes">{{ t('common.notes') }}</FieldLabel>
                  <Textarea
                    id="tx-notes"
                    v-model="notes"
                    :placeholder="t('transaction.notesPlaceholder')"
                    rows="2"
                    class="resize-none"
                  />
                </Field>
              </FieldGroup>

              <Separator />

              <div class="grid gap-2 sm:grid-cols-2">
                <Button
                  v-if="allowEatFirst && !requiresImmediatePayment"
                  variant="outline"
                  :disabled="isSubmitting || !cart.length"
                  @click="handleSubmit(false)"
                >
                  {{ isSubmitting ? t('common.saving') : t('transaction.eatFirst') }}
                </Button>
                <Button
                  v-if="allowEatFirst && !requiresImmediatePayment"
                  variant="outline"
                  :disabled="isSubmitting || !cart.length"
                  @click="openQueueFlow('debt')"
                >
                  <ClipboardList class="size-4" />
                  {{ isSubmitting ? t('common.processing') : t('transaction.eatFirstQueue') }}
                </Button>
                <Button
                  v-if="allowPayFirst"
                  :disabled="isSubmitting || !cart.length"
                  @click="openPaymentDialog(false)"
                >
                  <Banknote class="size-4" />
                  {{ isSubmitting ? t('common.processing') : t('transaction.pay') }}
                </Button>
                <Button
                  v-if="allowPayFirst"
                  :disabled="isSubmitting || !cart.length"
                  @click="openQueueFlow('pay')"
                >
                  <Banknote class="size-4" />
                  <ClipboardList class="size-4" />
                  {{ isSubmitting ? t('common.processing') : t('transaction.payQueue') }}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card class="gap-0 py-0 shadow-sm">
            <CardContent class="space-y-4 px-5 py-5">
              <div class="flex items-center gap-2">
                <ShoppingCart class="size-5" />
                <h2 class="font-semibold">{{ t('transaction.cart') }}</h2>
              </div>

              <div v-if="!cart.length" class="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                {{ t('transaction.cartEmpty') }}
              </div>

              <div v-else class="max-h-[400px] space-y-2 overflow-y-auto pr-1">
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
                        <span v-if="!hasBundleAddons(item.addons)"> {{ t('transaction.perItem') }}</span>
                      </p>
                      <ul v-if="item.addons.length" class="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        <li v-for="addon in item.addons" :key="addon.product.id">
                          + {{ addon.product.name }}
                          <span v-if="addon.quantity > 1">x{{ addon.quantity }}</span>
                          ({{ formatPrice(addon.product.price * addon.quantity) }})
                        </li>
                      </ul>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      @click="removeFromCart(item.lineKey)"
                    >
                      <Trash2 class="size-4" />
                    </Button>
                  </div>

                  <div class="mt-3 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        @click="updateQuantity(item.lineKey, item.quantity - 1)"
                      >
                        <Minus class="size-4" />
                      </Button>
                      <span
                        v-if="hasBundleAddons(item.addons)"
                        class="min-w-6 text-center text-sm font-medium tabular-nums"
                      >
                        1
                      </span>
                      <Input
                        v-else
                        :model-value="item.quantity"
                        type="number"
                        min="1"
                        :max="item.product.stock_quantity"
                        class="w-16 text-center"
                        @update:model-value="updateQuantity(item.lineKey, Number($event))"
                      />
                      <Button
                        size="icon-sm"
                        variant="outline"
                        @click="updateQuantity(item.lineKey, item.quantity + 1)"
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

              <Separator />

              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">{{ t('common.total') }}</span>
                <span class="text-lg font-bold">{{ formatPrice(totalAmount) }}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <PaymentMethodDialog
        v-model:open="paymentDialogOpen"
        :transaction="null"
        :amount="totalAmount"
        :customer="selectedCustomer"
        @select="handlePayment"
      />

      <TableNumberDialog
        v-model:open="tableDialogOpen"
        @confirm="handleTableNumberConfirm"
      />

      <AddonSelectDialog
        v-model:open="addonDialogOpen"
        :product="pendingProduct"
        :addons="pendingProductAddons"
        :bundle-index="pendingBundleIndex"
        :bundle-total="pendingBundleTotal"
        @confirm="handleAddonConfirm"
      />

      <PaymentSuccessDialog
        v-model:open="paymentSuccessDialogOpen"
        :invoice="paymentSuccessInvoice"
      />
    </div>
  </DashboardLayout>
</template>
