<script setup lang="ts">
import { Receipt } from '@lucide/vue'
import AddonSelectDialog from '@/components/transactions/AddonSelectDialog.vue'
import PaymentMethodDialog from '@/components/transactions/PaymentMethodDialog.vue'
import PaymentSuccessDialog from '@/components/transactions/PaymentSuccessDialog.vue'
import TableNumberDialog from '@/components/transactions/TableNumberDialog.vue'
import TransactionCartPanel from '@/components/transactions/TransactionCartPanel.vue'
import TransactionFormPanel from '@/components/transactions/TransactionFormPanel.vue'
import { useTransactionCart } from '@/composables/useTransactionCart'
import { useI18n } from '@/composables/useI18n'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

const { t } = useI18n()

const {
  customers,
  selectedCustomerId,
  selectedCustomer,
  requiresImmediatePayment,
  allowPayFirst,
  allowEatFirst,
  requireTableForEatFirst,
  tableNumber,
  categoryFilter,
  menuCategories,
  notes,
  selectedProductId,
  selectedProduct,
  filteredProducts,
  addQuantity,
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
  formatPrice,
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
} = useTransactionCart()
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

      <div v-else class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <TransactionFormPanel
          v-model:selected-customer-id="selectedCustomerId"
          v-model:notes="notes"
          v-model:table-number="tableNumber"
          v-model:selected-product-id="selectedProductId"
          v-model:add-quantity="addQuantity"
          :customers="customers"
          :selected-customer="selectedCustomer"
          :requires-immediate-payment="requiresImmediatePayment"
          :allow-eat-first="allowEatFirst"
          :require-table-for-eat-first="requireTableForEatFirst"
          v-model:category-filter="categoryFilter"
          :menu-categories="menuCategories"
          :filtered-products="filteredProducts"
          :selected-product="selectedProduct"
          @add-product="handleAddSelectedProduct"
        />

        <TransactionCartPanel
          :cart="cart"
          :total-amount="totalAmount"
          :is-submitting="isSubmitting"
          :requires-immediate-payment="requiresImmediatePayment"
          :allow-pay-first="allowPayFirst"
          :allow-eat-first="allowEatFirst"
          :get-cart-line-subtotal="getCartLineSubtotal"
          @update-quantity="updateQuantity"
          @remove="removeFromCart"
          @submit-debt="handleSubmit(false)"
          @submit-debt-queue="openQueueFlow('debt')"
          @pay="openPaymentDialog(false)"
          @pay-queue="openQueueFlow('pay')"
        />
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
