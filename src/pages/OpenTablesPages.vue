<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Banknote, Eye, RefreshCw, UtensilsCrossed } from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import PaymentMethodDialog from '@/components/transactions/PaymentMethodDialog.vue'
import PaymentSuccessDialog from '@/components/transactions/PaymentSuccessDialog.vue'
import TransactionDetailDialog from '@/components/transactions/TransactionDetailDialog.vue'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getQueueStatusLabel } from '@/composables/useActiveQueues'
import { useI18n } from '@/composables/useI18n'
import { buildInvoiceFromTransaction, type InvoiceData } from '@/lib/invoice'
import { formatPrice } from '@/lib/format'
import { getOpenTableTransactions, getTransactionById, markTransactionAsPaid } from '@/lib/transaction'
import { useAlertStore } from '@/stores/useAlertStore'
import { WALK_IN_CUSTOMER_NAME } from '@/types/database'
import type { OpenTableTransaction, PaymentMethod, TransactionWithDetails } from '@/types/database'

const { t, locale } = useI18n()
const alertStore = useAlertStore()

const transactions = ref<OpenTableTransaction[]>([])
const isLoading = ref(true)
const isPaying = ref(false)
const paymentDialogOpen = ref(false)
const paymentSuccessDialogOpen = ref(false)
const paymentSuccessInvoice = ref<InvoiceData | null>(null)
const detailDialogOpen = ref(false)
const selectedTransaction = ref<TransactionWithDetails | null>(null)
const payingTransaction = ref<OpenTableTransaction | null>(null)

const dateLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'id-ID'))

function displayCustomerName(name: string | undefined | null) {
  if (!name) return '-'
  if (name === WALK_IN_CUSTOMER_NAME) return t('common.walkIn')
  return name
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(dateLocale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function latestQueue(transaction: OpenTableTransaction) {
  const queues = transaction.order_queues ?? []
  if (!queues.length) return null
  return [...queues].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
}

async function loadTransactions() {
  isLoading.value = true
  const { transactions: data, error } = await getOpenTableTransactions()
  isLoading.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), error.message, 'error')
    return
  }

  transactions.value = data ?? []
}

function openPayDialog(transaction: OpenTableTransaction) {
  payingTransaction.value = transaction
  paymentDialogOpen.value = true
}

async function handlePay(method: PaymentMethod, loyaltyPointsRedeemed = 0) {
  if (!payingTransaction.value) return

  isPaying.value = true
  const { transaction, error } = await markTransactionAsPaid(
    payingTransaction.value.id,
    method,
    { loyaltyPointsRedeemed },
  )
  isPaying.value = false
  paymentDialogOpen.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), error.message, 'error')
    return
  }

  if (!transaction) return

  const { transaction: details, error: fetchError } = await getTransactionById(transaction.id)
  if (!fetchError && details) {
    paymentSuccessInvoice.value = buildInvoiceFromTransaction(
      details,
      method,
      { paidAt: transaction.paid_at ?? new Date().toISOString() },
    )
    paymentSuccessDialogOpen.value = true
  }

  payingTransaction.value = null
  await loadTransactions()
}

async function openDetail(transaction: OpenTableTransaction) {
  const { transaction: details, error } = await getTransactionById(transaction.id)
  if (error || !details) {
    alertStore.showAlert(t('alert.error'), error?.message ?? t('alert.error'), 'error')
    return
  }

  selectedTransaction.value = details
  detailDialogOpen.value = true
}

onMounted(loadTransactions)
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6 p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <UtensilsCrossed class="size-6" />
            {{ t('transaction.openTables') }}
          </h1>
          <p class="text-sm text-muted-foreground">{{ t('transaction.openTablesSubtitle') }}</p>
        </div>
        <Button variant="outline" :disabled="isLoading" @click="loadTransactions">
          <RefreshCw class="size-4" :class="{ 'animate-spin': isLoading }" />
          {{ t('common.refresh') }}
        </Button>
      </div>

      <div class="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t('common.table') }}</TableHead>
              <TableHead>{{ t('queue.customer') }}</TableHead>
              <TableHead>{{ t('common.total') }}</TableHead>
              <TableHead>{{ t('common.status') }}</TableHead>
              <TableHead>{{ t('transaction.openedAt') }}</TableHead>
              <TableHead class="text-right">{{ t('common.actions') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading">
              <TableCell colspan="6" class="h-24 text-center text-muted-foreground">
                {{ t('common.loading') }}
              </TableCell>
            </TableRow>
            <TableRow v-else-if="!transactions.length">
              <TableCell colspan="6" class="h-24 text-center text-muted-foreground">
                {{ t('transaction.noOpenTables') }}
              </TableCell>
            </TableRow>
            <TableRow v-for="transaction in transactions" :key="transaction.id">
              <TableCell class="font-medium">
                {{ transaction.table_number || '-' }}
              </TableCell>
              <TableCell>
                {{ displayCustomerName(transaction.customers?.name) }}
              </TableCell>
              <TableCell>{{ formatPrice(transaction.total_amount) }}</TableCell>
              <TableCell>
                <span v-if="latestQueue(transaction)">
                  {{ getQueueStatusLabel(latestQueue(transaction)!.status) }}
                </span>
                <span v-else class="text-muted-foreground">{{ t('status.unpaid') }}</span>
              </TableCell>
              <TableCell class="text-muted-foreground">
                {{ formatDateTime(transaction.created_at) }}
              </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-2">
                  <Button size="sm" variant="outline" @click="openDetail(transaction)">
                    <Eye class="size-4" />
                    {{ t('transaction.detail') }}
                  </Button>
                  <Button size="sm" @click="openPayDialog(transaction)">
                    <Banknote class="size-4" />
                    {{ t('transaction.pay') }}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <PaymentMethodDialog
        v-model:open="paymentDialogOpen"
        :transaction="payingTransaction"
        :amount="payingTransaction?.total_amount ?? 0"
        @select="handlePay"
      />

      <PaymentSuccessDialog
        v-model:open="paymentSuccessDialogOpen"
        :invoice="paymentSuccessInvoice"
      />

      <TransactionDetailDialog
        v-model:open="detailDialogOpen"
        :transaction="selectedTransaction"
      />
    </div>
  </DashboardLayout>
</template>
