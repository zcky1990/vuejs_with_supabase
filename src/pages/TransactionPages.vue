<script setup lang="ts">
import { Receipt } from '@lucide/vue'
import AddonSelectDialog from '@/components/transactions/AddonSelectDialog.vue'
import PaymentMethodDialog from '@/components/transactions/PaymentMethodDialog.vue'
import PaymentSuccessDialog from '@/components/transactions/PaymentSuccessDialog.vue'
import TableNumberDialog from '@/components/transactions/TableNumberDialog.vue'
import TransactionCartPanel from '@/components/transactions/TransactionCartPanel.vue'
import TransactionFormPanel from '@/components/transactions/TransactionFormPanel.vue'
import { useTransactionCart } from '@/composables/useTransactionCart'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

const {
  customers,
  selectedCustomerId,
  selectedCustomer,
  requiresImmediatePayment,
  notes,
  selectedProductId,
  selectedProduct,
  availableProducts,
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
          Transaksi
        </h1>
        <p class="text-sm text-muted-foreground">
          Pembelian pada hari yang sama akan digabung jika transaksi sebelumnya belum dibayar.
        </p>
      </div>

      <div
        v-if="pendingTransaction && !requiresImmediatePayment"
        class="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm"
      >
        <p class="font-medium text-foreground">Transaksi belum dibayar hari ini</p>
        <p class="text-muted-foreground">
          Pembelian berikutnya untuk pembeli ini akan ditambahkan ke transaksi
          <span class="font-medium text-foreground">{{ formatPrice(pendingTransaction.total_amount) }}</span>.
        </p>
      </div>

      <div v-if="isLoading" class="text-sm text-muted-foreground">
        Memuat data...
      </div>

      <div v-else class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <TransactionFormPanel
          v-model:selected-customer-id="selectedCustomerId"
          v-model:notes="notes"
          v-model:selected-product-id="selectedProductId"
          v-model:add-quantity="addQuantity"
          :customers="customers"
          :selected-customer="selectedCustomer"
          :requires-immediate-payment="requiresImmediatePayment"
          :available-products="availableProducts"
          :selected-product="selectedProduct"
          @add-product="handleAddSelectedProduct"
        />

        <TransactionCartPanel
          :cart="cart"
          :total-amount="totalAmount"
          :is-submitting="isSubmitting"
          :requires-immediate-payment="requiresImmediatePayment"
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
