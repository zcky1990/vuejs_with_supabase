<script setup lang="ts">
import { computed, ref } from 'vue'
import { Banknote, Ban, Pencil } from '@lucide/vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/composables/useI18n'
import { formatItemWithAddons } from '@/lib/addon'
import { formatPrice } from '@/lib/format'
import PaymentMethodDialog from '@/components/transactions/PaymentMethodDialog.vue'
import PaymentSuccessDialog from '@/components/transactions/PaymentSuccessDialog.vue'
import CancelTransactionDialog from '@/components/transactions/CancelTransactionDialog.vue'
import TransactionEditDialog from '@/components/transactions/TransactionEditDialog.vue'
import { buildInvoiceFromTransaction, type InvoiceData } from '@/lib/invoice'
import { markTransactionAsPaid, isActiveTransaction } from '@/lib/transaction'
import { useAlertStore } from '@/stores/useAlertStore'
import { WALK_IN_CUSTOMER_NAME } from '@/types/database'
import type { CustomerTransactionSummary, PaymentMethod, TransactionWithDetails } from '@/types/database'

const props = defineProps<{
  open: boolean
  customer: CustomerTransactionSummary | null
}>()

const { t, locale } = useI18n()

const emit = defineEmits<{
  'update:open': [value: boolean]
  refresh: []
}>()

const alertStore = useAlertStore()
const paymentDialogOpen = ref(false)
const paymentSuccessDialogOpen = ref(false)
const paymentSuccessInvoice = ref<InvoiceData | null>(null)
const editDialogOpen = ref(false)
const cancelDialogOpen = ref(false)
const selectedTransaction = ref<TransactionWithDetails | null>(null)
const isPaying = ref(false)

const dateLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'id-ID'))

const unpaidTransactions = computed(() =>
  (props.customer?.transactions ?? [])
    .filter((transaction) => isActiveTransaction(transaction) && !transaction.is_paid)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
)

const totalOutstanding = computed(() =>
  unpaidTransactions.value.reduce((sum, transaction) => sum + Number(transaction.total_amount), 0),
)

function displayCustomerName(name: string | undefined | null) {
  if (!name) return ''
  if (name === WALK_IN_CUSTOMER_NAME) return t('common.walkIn')
  return name
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(dateLocale.value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatItems(transaction: TransactionWithDetails) {
  return transaction.transaction_items
    .map((item) => formatItemWithAddons(item))
    .join(' · ')
}

function openPaymentDialog(transaction: TransactionWithDetails) {
  selectedTransaction.value = transaction
  paymentDialogOpen.value = true
}

function openEditDialog(transaction: TransactionWithDetails) {
  selectedTransaction.value = transaction
  editDialogOpen.value = true
}

function openCancelDialog(transaction: TransactionWithDetails) {
  selectedTransaction.value = transaction
  cancelDialogOpen.value = true
}

async function handlePayment(method: PaymentMethod, loyaltyPointsRedeemed = 0) {
  if (!selectedTransaction.value) return

  const transactionSnapshot = selectedTransaction.value
  isPaying.value = true
  const { transaction, error } = await markTransactionAsPaid(
    transactionSnapshot.id,
    method,
    { loyaltyPointsRedeemed },
  )
  isPaying.value = false
  paymentDialogOpen.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), error.message, 'error')
    return
  }

  const paidAt = transaction?.paid_at ?? new Date().toISOString()
  paymentSuccessInvoice.value = buildInvoiceFromTransaction(
    {
      ...transactionSnapshot,
      is_paid: true,
      payment_method: method,
      paid_at: paidAt,
    },
    method,
    { paidAt },
  )
  paymentSuccessDialogOpen.value = true
  emit('refresh')
}

function handleSaved() {
  emit('refresh')
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]">
      <DialogHeader class="border-b px-6 pt-6 pb-4">
        <DialogTitle class="text-xl">
          {{ t('transaction.debtTitle', { name: displayCustomerName(customer?.customerName) }) }}
        </DialogTitle>
        <DialogDescription>
          {{ t('transaction.debtDesc') }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto px-6 py-4">
        <div
          v-if="!unpaidTransactions.length"
          class="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground"
        >
          {{ t('transaction.noDebt') }}
        </div>

        <div v-else class="space-y-3">
          <article
            v-for="transaction in unpaidTransactions"
            :key="transaction.id"
            class="rounded-lg border p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="font-semibold">{{ formatShortDate(transaction.created_at) }}</p>
                  <span class="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    {{ t('status.unpaid') }}
                  </span>
                </div>
                <p class="mt-1.5 text-sm text-muted-foreground">
                  {{ formatItems(transaction) }}
                </p>
              </div>
              <p class="shrink-0 text-base font-bold">
                {{ formatPrice(transaction.total_amount) }}
              </p>
            </div>

            <div class="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                class="flex-1"
                @click="openEditDialog(transaction)"
              >
                <Pencil class="size-3.5" />
                {{ t('transaction.fix') }}
              </Button>
              <Button
                size="sm"
                variant="outline"
                class="shrink-0"
                :title="t('transaction.voidCancel')"
                @click="openCancelDialog(transaction)"
              >
                <Ban class="size-3.5" />
              </Button>
              <Button
                size="sm"
                class="flex-1"
                :disabled="isPaying"
                @click="openPaymentDialog(transaction)"
              >
                <Banknote class="size-3.5" />
                {{ t('common.pay') }}
              </Button>
            </div>
          </article>
        </div>
      </div>

      <div v-if="unpaidTransactions.length" class="border-t bg-muted/30 px-6 py-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">
            {{ t('transaction.unpaidTxCount', { count: unpaidTransactions.length }) }}
          </span>
          <div class="text-right">
            <p class="text-xs text-muted-foreground">{{ t('transaction.totalOutstanding') }}</p>
            <p class="text-xl font-bold">{{ formatPrice(totalOutstanding) }}</p>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <PaymentMethodDialog
    v-model:open="paymentDialogOpen"
    :transaction="selectedTransaction"
    @select="handlePayment"
  />

  <PaymentSuccessDialog
    v-model:open="paymentSuccessDialogOpen"
    :invoice="paymentSuccessInvoice"
  />

  <TransactionEditDialog
    v-model:open="editDialogOpen"
    :transaction="selectedTransaction"
    @saved="handleSaved"
  />

  <CancelTransactionDialog
    v-model:open="cancelDialogOpen"
    :transaction="selectedTransaction"
    @cancelled="handleSaved"
  />
</template>
