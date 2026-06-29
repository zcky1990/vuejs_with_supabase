<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Banknote, Ban, ChevronLeft, ChevronRight, Eye, List, Pencil, Printer, Users, X } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import CancelTransactionDialog from '@/components/transactions/CancelTransactionDialog.vue'
import CustomerTransactionsDialog from '@/components/transactions/CustomerTransactionsDialog.vue'
import PaymentMethodDialog from '@/components/transactions/PaymentMethodDialog.vue'
import PaymentBreakdownCards from '@/components/transactions/PaymentBreakdownCards.vue'
import PaymentSuccessDialog from '@/components/transactions/PaymentSuccessDialog.vue'
import TransactionDetailDialog from '@/components/transactions/TransactionDetailDialog.vue'
import TransactionEditDialog from '@/components/transactions/TransactionEditDialog.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useI18n } from '@/composables/useI18n'
import { getTransactions, isActiveTransaction, markTransactionAsPaid } from '@/lib/transaction'
import { buildPaymentBreakdownWithZeros } from '@/lib/payment-breakdown'
import { buildInvoiceFromTransaction, type InvoiceData } from '@/lib/invoice'
import { printTransactionReceipt } from '@/lib/print-invoice'
import { formatPrice } from '@/lib/format'
import { getShopDateString } from '@/lib/date'
import { useAlertStore } from '@/stores/useAlertStore'
import { WALK_IN_CUSTOMER_NAME } from '@/types/database'
import type { CustomerTransactionSummary, PaymentMethod, TransactionWithDetails } from '@/types/database'

type ViewMode = 'transaction' | 'customer'
type PaymentFilter = 'all' | 'unpaid' | 'paid'
type StatusFilter = 'all' | 'active' | 'cancelled'
type PaymentMethodFilter = 'all' | PaymentMethod

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

const { t, locale } = useI18n()
const alertStore = useAlertStore()
const transactions = ref<TransactionWithDetails[]>([])
const viewMode = ref<ViewMode>('transaction')
const paymentFilter = ref<PaymentFilter>('unpaid')
const statusFilter = ref<StatusFilter>('all')
const paymentMethodFilter = ref<PaymentMethodFilter>('all')
const searchQuery = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const tableNumberFilter = ref('')
const currentPage = ref(1)
const pageSize = ref<number>(PAGE_SIZE_OPTIONS[1])
const isLoading = ref(true)
const customerDialogOpen = ref(false)
const detailDialogOpen = ref(false)
const editDialogOpen = ref(false)
const paymentDialogOpen = ref(false)
const paymentSuccessDialogOpen = ref(false)
const paymentSuccessInvoice = ref<InvoiceData | null>(null)
const cancelDialogOpen = ref(false)
const isPaying = ref(false)
const selectedCustomer = ref<CustomerTransactionSummary | null>(null)
const selectedTransaction = ref<TransactionWithDetails | null>(null)

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

function getTransactionDateKey(createdAt: string) {
  return getShopDateString(new Date(createdAt))
}

function matchesSearch(transaction: TransactionWithDetails, query: string) {
  const buyerName = transaction.customers?.name?.toLowerCase() ?? ''
  const walkInLabel = t('common.walkIn').toLowerCase()
  const displayName = buyerName === WALK_IN_CUSTOMER_NAME.toLowerCase() ? walkInLabel : buyerName
  const notes = transaction.notes?.toLowerCase() ?? ''
  const table = transaction.table_number?.toLowerCase() ?? ''

  return displayName.includes(query)
    || buyerName.includes(query)
    || notes.includes(query)
    || table.includes(query)
}

const filteredTransactions = computed(() => {
  let result = transactions.value

  if (paymentFilter.value === 'unpaid') {
    result = result.filter(
      (transaction) => isActiveTransaction(transaction) && !transaction.is_paid,
    )
  } else if (paymentFilter.value === 'paid') {
    result = result.filter(
      (transaction) => isActiveTransaction(transaction) && transaction.is_paid,
    )
  }

  if (statusFilter.value === 'active') {
    result = result.filter((transaction) => isActiveTransaction(transaction))
  } else if (statusFilter.value === 'cancelled') {
    result = result.filter((transaction) => !isActiveTransaction(transaction))
  }

  if (paymentMethodFilter.value !== 'all') {
    result = result.filter(
      (transaction) => transaction.payment_method === paymentMethodFilter.value,
    )
  }

  if (dateFrom.value) {
    result = result.filter(
      (transaction) => getTransactionDateKey(transaction.created_at) >= dateFrom.value,
    )
  }

  if (dateTo.value) {
    result = result.filter(
      (transaction) => getTransactionDateKey(transaction.created_at) <= dateTo.value,
    )
  }

  const tableQuery = tableNumberFilter.value.trim().toLowerCase()
  if (tableQuery) {
    result = result.filter(
      (transaction) => transaction.table_number?.toLowerCase().includes(tableQuery),
    )
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter((transaction) => matchesSearch(transaction, query))
  }

  return result
})

const hasActiveFilters = computed(() =>
  statusFilter.value !== 'all'
  || paymentMethodFilter.value !== 'all'
  || !!searchQuery.value.trim()
  || !!dateFrom.value
  || !!dateTo.value
  || !!tableNumberFilter.value.trim(),
)

const totalFilteredCount = computed(() =>
  viewMode.value === 'transaction'
    ? filteredTransactions.value.length
    : customerSummaries.value.length,
)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalFilteredCount.value / pageSize.value)),
)

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTransactions.value.slice(start, start + pageSize.value)
})

const paginatedCustomerSummaries = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return customerSummaries.value.slice(start, start + pageSize.value)
})

const paginationFrom = computed(() => {
  if (!totalFilteredCount.value) return 0
  return (currentPage.value - 1) * pageSize.value + 1
})

const paginationTo = computed(() =>
  Math.min(currentPage.value * pageSize.value, totalFilteredCount.value),
)

function clearFilters() {
  statusFilter.value = 'all'
  paymentMethodFilter.value = 'all'
  searchQuery.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  tableNumberFilter.value = ''
  currentPage.value = 1
}

function goToPage(page: number) {
  currentPage.value = Math.min(Math.max(1, page), totalPages.value)
}

watch(
  [paymentFilter, statusFilter, paymentMethodFilter, searchQuery, dateFrom, dateTo, tableNumberFilter, viewMode, pageSize],
  () => {
    currentPage.value = 1
  },
)

watch(totalPages, (pages) => {
  if (currentPage.value > pages) {
    currentPage.value = pages
  }
})

const paidTransactionsForSummary = computed(() =>
  filteredTransactions.value.filter(
    (transaction) => isActiveTransaction(transaction) && transaction.is_paid && transaction.payment_method,
  ),
)

const paymentBreakdown = computed(() =>
  buildPaymentBreakdownWithZeros(
    paidTransactionsForSummary.value.map((transaction) => ({
      payment_method: transaction.payment_method!,
      total_amount: transaction.total_amount,
    })),
  ),
)

const showPaymentSummary = computed(() =>
  viewMode.value === 'transaction' && paidTransactionsForSummary.value.length > 0,
)

function transactionStatusLabel(transaction: TransactionWithDetails) {
  if (!isActiveTransaction(transaction)) return t('status.cancelled')
  return transaction.is_paid ? t('status.paid') : t('status.unpaid')
}

function transactionStatusClass(transaction: TransactionWithDetails) {
  if (!isActiveTransaction(transaction)) {
    return 'bg-destructive/15 text-destructive'
  }

  return transaction.is_paid
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
}

const customerSummaries = computed<CustomerTransactionSummary[]>(() => {
  const map = new Map<string, CustomerTransactionSummary>()

  for (const transaction of filteredTransactions.value) {
    if (!isActiveTransaction(transaction)) continue

    const customerId = transaction.customer_id
    const rawName = transaction.customers?.name
    const customerName = rawName === WALK_IN_CUSTOMER_NAME
      ? t('common.walkIn')
      : (rawName ?? t('common.unknownBuyer'))
    const existing = map.get(customerId)

    if (existing) {
      existing.transactionCount += 1
      existing.totalAmount += Number(transaction.total_amount)
      if (!transaction.is_paid) {
        existing.unpaidCount += 1
        existing.outstandingAmount += Number(transaction.total_amount)
      }
      existing.transactions.push(transaction)
    } else {
      map.set(customerId, {
        customerId,
        customerName,
        transactionCount: 1,
        totalAmount: Number(transaction.total_amount),
        outstandingAmount: transaction.is_paid ? 0 : Number(transaction.total_amount),
        unpaidCount: transaction.is_paid ? 0 : 1,
        transactions: [transaction],
      })
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.customerName.localeCompare(b.customerName, dateLocale.value),
  )
})

async function loadTransactions() {
  isLoading.value = true
  const { transactions: data, error } = await getTransactions()
  isLoading.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), error.message, 'error')
    return
  }

  transactions.value = (data ?? []) as TransactionWithDetails[]
}

function openCustomerDialog(summary: CustomerTransactionSummary) {
  selectedCustomer.value = summary
  customerDialogOpen.value = true
}

function openTransactionDetail(transaction: TransactionWithDetails) {
  selectedTransaction.value = transaction
  detailDialogOpen.value = true
}

function openTransactionEdit(transaction: TransactionWithDetails) {
  selectedTransaction.value = transaction
  editDialogOpen.value = true
}

function openPaymentDialog(transaction: TransactionWithDetails) {
  selectedTransaction.value = transaction
  paymentDialogOpen.value = true
}

async function handlePrintReceipt(transaction: TransactionWithDetails) {
  if (!transaction.is_paid || !transaction.payment_method) return
  await printTransactionReceipt(transaction)
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
  await loadTransactions()
}

function openCancelDialog(transaction: TransactionWithDetails) {
  selectedTransaction.value = transaction
  cancelDialogOpen.value = true
}

function openCancelFromDetail() {
  detailDialogOpen.value = false
  cancelDialogOpen.value = true
}

async function handleTransactionCancelled() {
  await loadTransactions()

  if (!selectedTransaction.value) return

  const updated = transactions.value.find(
    (transaction) => transaction.id === selectedTransaction.value!.id,
  )

  if (updated) {
    selectedTransaction.value = updated
  }
}

function openEditFromDetail() {
  detailDialogOpen.value = false
  editDialogOpen.value = true
}

async function handleTransactionSaved() {
  await loadTransactions()

  if (!selectedTransaction.value) return

  const updated = transactions.value.find(
    (transaction) => transaction.id === selectedTransaction.value!.id,
  )

  if (updated) {
    selectedTransaction.value = updated
  }
}

async function handleCustomerDialogRefresh() {
  await loadTransactions()

  if (!selectedCustomer.value) return

  const updated = customerSummaries.value.find(
    (summary) => summary.customerId === selectedCustomer.value!.customerId,
  )

  if (updated && updated.unpaidCount > 0) {
    selectedCustomer.value = updated
  } else {
    customerDialogOpen.value = false
    selectedCustomer.value = null
  }
}

onMounted(loadTransactions)
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6 p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">{{ t('transaction.listTitle') }}</h1>
          <p class="text-sm text-muted-foreground">
            {{ t('transaction.listSubtitle') }}
          </p>
        </div>
        <Button as-child>
          <RouterLink to="/transactions">{{ t('dashboard.actionNewTx') }}</RouterLink>
        </Button>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div class="flex gap-2">
          <Button
            :variant="viewMode === 'transaction' ? 'default' : 'outline'"
            @click="viewMode = 'transaction'"
          >
            <List class="size-4" />
            {{ t('transaction.perTransaction') }}
          </Button>
          <Button
            :variant="viewMode === 'customer' ? 'default' : 'outline'"
            @click="viewMode = 'customer'"
          >
            <Users class="size-4" />
            {{ t('transaction.perBuyer') }}
          </Button>
        </div>

        <div class="flex gap-2">
          <Button
            :variant="paymentFilter === 'all' ? 'default' : 'outline'"
            size="sm"
            @click="paymentFilter = 'all'"
          >
            {{ t('common.all') }}
          </Button>
          <Button
            :variant="paymentFilter === 'unpaid' ? 'default' : 'outline'"
            size="sm"
            @click="paymentFilter = 'unpaid'"
          >
            {{ t('transaction.unpaidFilter') }}
          </Button>
          <Button
            :variant="paymentFilter === 'paid' ? 'default' : 'outline'"
            size="sm"
            @click="paymentFilter = 'paid'"
          >
            {{ t('transaction.paidFilter') }}
          </Button>
        </div>
      </div>

      <div class="flex flex-col gap-3 rounded-xl border bg-background p-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <Input
            v-model="searchQuery"
            :placeholder="t('transaction.searchPlaceholder')"
            class="w-full lg:max-w-xs"
          />
          <Input
            v-model="dateFrom"
            type="date"
            :placeholder="t('transaction.dateFrom')"
            class="w-full sm:w-auto"
            :aria-label="t('transaction.dateFrom')"
          />
          <Input
            v-model="dateTo"
            type="date"
            :placeholder="t('transaction.dateTo')"
            class="w-full sm:w-auto"
            :aria-label="t('transaction.dateTo')"
          />
          <Input
            v-model="tableNumberFilter"
            :placeholder="t('transaction.filterTablePh')"
            class="w-full sm:w-36"
          />
          <Select v-model="statusFilter">
            <SelectTrigger class="w-full sm:w-[180px]">
              <SelectValue :placeholder="t('transaction.statusFilter')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{{ t('status.allStatus') }}</SelectItem>
              <SelectItem value="active">{{ t('common.active') }}</SelectItem>
              <SelectItem value="cancelled">{{ t('status.cancelled') }}</SelectItem>
            </SelectContent>
          </Select>
          <Select v-model="paymentMethodFilter">
            <SelectTrigger class="w-full sm:w-[180px]">
              <SelectValue :placeholder="t('transaction.paymentMethodFilter')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{{ t('common.all') }}</SelectItem>
              <SelectItem value="cash">{{ t('payment.cash') }}</SelectItem>
              <SelectItem value="qris">{{ t('payment.qris') }}</SelectItem>
              <SelectItem value="transfer">{{ t('payment.transfer') }}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            v-if="hasActiveFilters"
            variant="outline"
            size="sm"
            class="shrink-0"
            @click="clearFilters"
          >
            <X class="size-4" />
            {{ t('transaction.clearFilters') }}
          </Button>
        </div>
      </div>

      <Card v-if="showPaymentSummary">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">{{ t('transaction.fundBreakdown') }}</CardTitle>
          <CardDescription>{{ t('transaction.fundBreakdownDesc') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentBreakdownCards :rows="paymentBreakdown" />
        </CardContent>
      </Card>

      <div class="rounded-xl border bg-background">
        <Table>
          <TableHeader v-if="viewMode === 'transaction'">
            <TableRow>
              <TableHead>{{ t('common.date') }}</TableHead>
              <TableHead>{{ t('common.buyer') }}</TableHead>
              <TableHead>{{ t('common.product') }}</TableHead>
              <TableHead>{{ t('common.notes') }}</TableHead>
              <TableHead>{{ t('common.status') }}</TableHead>
              <TableHead class="text-right">{{ t('common.total') }}</TableHead>
              <TableHead class="text-right">{{ t('common.actions') }}</TableHead>
            </TableRow>
          </TableHeader>

          <TableHeader v-else>
            <TableRow>
              <TableHead>{{ t('common.buyer') }}</TableHead>
              <TableHead>{{ t('transaction.txCount') }}</TableHead>
              <TableHead>{{ t('transaction.unpaidCount') }}</TableHead>
              <TableHead class="text-right">{{ t('transaction.totalDebt') }}</TableHead>
              <TableHead class="text-right">{{ t('common.actions') }}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow v-if="isLoading">
              <TableCell :colspan="7" class="text-center text-muted-foreground">
                {{ t('common.loading') }}
              </TableCell>
            </TableRow>

            <template v-else-if="viewMode === 'transaction'">
              <TableRow v-if="!filteredTransactions.length">
                <TableCell :colspan="7" class="text-center text-muted-foreground">
                  {{ transactions.length ? t('transaction.noFilterMatch') : t('transaction.noTransactions') }}
                </TableCell>
              </TableRow>
              <TableRow v-for="transaction in paginatedTransactions" :key="transaction.id">
                <TableCell>{{ formatDateTime(transaction.created_at) }}</TableCell>
                <TableCell class="font-medium">
                  {{ displayCustomerName(transaction.customers?.name) }}
                </TableCell>
                <TableCell>{{ transaction.transaction_items.length }} {{ t('common.items') }}</TableCell>
                <TableCell class="max-w-[200px] truncate text-muted-foreground" :title="transaction.notes ?? undefined">
                  {{ transaction.notes?.trim() || '-' }}
                </TableCell>
                <TableCell>
                  <span
                    class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="transactionStatusClass(transaction)"
                  >
                    {{ transactionStatusLabel(transaction) }}
                  </span>
                </TableCell>
                <TableCell class="text-right font-medium">
                  {{ formatPrice(transaction.total_amount) }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <Button
                      v-if="isActiveTransaction(transaction) && transaction.is_paid && transaction.payment_method"
                      size="icon-sm"
                      variant="outline"
                      :title="t('payment.printInvoice')"
                      @click="handlePrintReceipt(transaction)"
                    >
                      <Printer class="size-4" />
                    </Button>
                    <Button
                      v-if="isActiveTransaction(transaction) && !transaction.is_paid"
                      size="sm"
                      :disabled="isPaying"
                      @click="openPaymentDialog(transaction)"
                    >
                      <Banknote class="size-4" />
                      {{ t('common.pay') }}
                    </Button>
                    <Button
                      v-if="isActiveTransaction(transaction) && !transaction.is_paid"
                      size="icon-sm"
                      variant="outline"
                      @click="openTransactionEdit(transaction)"
                    >
                      <Pencil class="size-4" />
                    </Button>
                    <Button
                      v-if="isActiveTransaction(transaction)"
                      size="icon-sm"
                      variant="outline"
                      :title="t('transaction.voidCancel')"
                      @click="openCancelDialog(transaction)"
                    >
                      <Ban class="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      @click="openTransactionDetail(transaction)"
                    >
                      <Eye class="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </template>

            <template v-else>
              <TableRow v-if="!customerSummaries.length">
                <TableCell :colspan="5" class="text-center text-muted-foreground">
                  {{ transactions.length ? t('transaction.noFilterMatch') : t('transaction.noTransactions') }}
                </TableCell>
              </TableRow>
              <TableRow
                v-for="summary in paginatedCustomerSummaries"
                :key="summary.customerId"
                class="cursor-pointer"
                @click="openCustomerDialog(summary)"
              >
                <TableCell class="font-medium">{{ summary.customerName }}</TableCell>
                <TableCell>{{ summary.transactionCount }}</TableCell>
                <TableCell>{{ summary.unpaidCount }}</TableCell>
                <TableCell class="text-right font-medium">
                  {{ formatPrice(summary.outstandingAmount) }}
                </TableCell>
                <TableCell class="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    @click.stop="openCustomerDialog(summary)"
                  >
                    {{ t('common.view') }}
                  </Button>
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>

        <div
          v-if="!isLoading && totalFilteredCount > 0"
          class="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-sm text-muted-foreground">
            {{ t('transaction.showingResults', { from: paginationFrom, to: paginationTo, total: totalFilteredCount }) }}
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <Select
              :model-value="String(pageSize)"
              @update:model-value="pageSize = Number($event)"
            >
              <SelectTrigger class="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="size in PAGE_SIZE_OPTIONS"
                  :key="size"
                  :value="String(size)"
                >
                  {{ t('transaction.pageSize', { count: size }) }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon-sm"
              :disabled="currentPage <= 1"
              :title="t('common.previous')"
              @click="goToPage(currentPage - 1)"
            >
              <ChevronLeft class="size-4" />
            </Button>
            <span class="min-w-[88px] text-center text-sm tabular-nums">
              {{ t('transaction.pageOf', { page: currentPage, total: totalPages }) }}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              :disabled="currentPage >= totalPages"
              :title="t('common.next')"
              @click="goToPage(currentPage + 1)"
            >
              <ChevronRight class="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <CustomerTransactionsDialog
        v-model:open="customerDialogOpen"
        :customer="selectedCustomer"
        @refresh="handleCustomerDialogRefresh"
      />

      <TransactionDetailDialog
        v-model:open="detailDialogOpen"
        :transaction="selectedTransaction"
        @edit="openEditFromDetail"
        @cancel="openCancelFromDetail"
      />

      <TransactionEditDialog
        v-model:open="editDialogOpen"
        :transaction="selectedTransaction"
        @saved="handleTransactionSaved"
      />

      <PaymentMethodDialog
        v-model:open="paymentDialogOpen"
        :transaction="selectedTransaction"
        @select="handlePayment"
      />

      <PaymentSuccessDialog
        v-model:open="paymentSuccessDialogOpen"
        :invoice="paymentSuccessInvoice"
      />

      <CancelTransactionDialog
        v-model:open="cancelDialogOpen"
        :transaction="selectedTransaction"
        @cancelled="handleTransactionCancelled"
      />
    </div>
  </DashboardLayout>
</template>
