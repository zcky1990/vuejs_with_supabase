<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Banknote, Eye, List, Pencil, Users } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import CustomerTransactionsDialog from '@/components/transactions/CustomerTransactionsDialog.vue'
import PaymentMethodDialog from '@/components/transactions/PaymentMethodDialog.vue'
import PaymentSuccessDialog from '@/components/transactions/PaymentSuccessDialog.vue'
import TransactionDetailDialog from '@/components/transactions/TransactionDetailDialog.vue'
import TransactionEditDialog from '@/components/transactions/TransactionEditDialog.vue'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getTransactions, markTransactionAsPaid } from '@/lib/transaction'
import { buildInvoiceFromTransaction, type InvoiceData } from '@/lib/invoice'
import { formatPrice } from '@/lib/format'
import { useAlertStore } from '@/stores/useAlertStore'
import type { CustomerTransactionSummary, PaymentMethod, TransactionWithDetails } from '@/types/database'

type ViewMode = 'transaction' | 'customer'
type PaymentFilter = 'all' | 'unpaid' | 'paid'

const alertStore = useAlertStore()
const transactions = ref<TransactionWithDetails[]>([])
const viewMode = ref<ViewMode>('transaction')
const paymentFilter = ref<PaymentFilter>('unpaid')
const isLoading = ref(true)
const customerDialogOpen = ref(false)
const detailDialogOpen = ref(false)
const editDialogOpen = ref(false)
const paymentDialogOpen = ref(false)
const paymentSuccessDialogOpen = ref(false)
const paymentSuccessInvoice = ref<InvoiceData | null>(null)
const isPaying = ref(false)
const selectedCustomer = ref<CustomerTransactionSummary | null>(null)
const selectedTransaction = ref<TransactionWithDetails | null>(null)

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

const filteredTransactions = computed(() => {
  if (paymentFilter.value === 'unpaid') {
    return transactions.value.filter((transaction) => !transaction.is_paid)
  }

  if (paymentFilter.value === 'paid') {
    return transactions.value.filter((transaction) => transaction.is_paid)
  }

  return transactions.value
})

const customerSummaries = computed<CustomerTransactionSummary[]>(() => {
  const map = new Map<string, CustomerTransactionSummary>()

  for (const transaction of filteredTransactions.value) {
    const customerId = transaction.customer_id
    const customerName = transaction.customers?.name ?? 'Pembeli tidak diketahui'
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
    a.customerName.localeCompare(b.customerName, 'id'),
  )
})

async function loadTransactions() {
  isLoading.value = true
  const { transactions: data, error } = await getTransactions()
  isLoading.value = false

  if (error) {
    alertStore.showAlert('Error', error.message, 'error')
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

async function handlePayment(method: PaymentMethod) {
  if (!selectedTransaction.value) return

  const transactionSnapshot = selectedTransaction.value
  isPaying.value = true
  const { transaction, error } = await markTransactionAsPaid(transactionSnapshot.id, method)
  isPaying.value = false
  paymentDialogOpen.value = false

  if (error) {
    alertStore.showAlert('Error', error.message, 'error')
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
          <h1 class="text-2xl font-bold tracking-tight">Daftar Transaksi</h1>
          <p class="text-sm text-muted-foreground">
            Lihat transaksi per item atau dikelompokkan per pembeli.
          </p>
        </div>
        <Button as-child>
          <RouterLink to="/transactions">Buat Transaksi</RouterLink>
        </Button>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div class="flex gap-2">
          <Button
            :variant="viewMode === 'transaction' ? 'default' : 'outline'"
            @click="viewMode = 'transaction'"
          >
            <List class="size-4" />
            Per Transaksi
          </Button>
          <Button
            :variant="viewMode === 'customer' ? 'default' : 'outline'"
            @click="viewMode = 'customer'"
          >
            <Users class="size-4" />
            Per Pembeli
          </Button>
        </div>

        <div class="flex gap-2">
          <Button
            :variant="paymentFilter === 'all' ? 'default' : 'outline'"
            size="sm"
            @click="paymentFilter = 'all'"
          >
            Semua
          </Button>
          <Button
            :variant="paymentFilter === 'unpaid' ? 'default' : 'outline'"
            size="sm"
            @click="paymentFilter = 'unpaid'"
          >
            Belum dibayar
          </Button>
          <Button
            :variant="paymentFilter === 'paid' ? 'default' : 'outline'"
            size="sm"
            @click="paymentFilter = 'paid'"
          >
            Sudah dibayar
          </Button>
        </div>
      </div>

      <div class="rounded-xl border bg-background">
        <Table>
          <TableHeader v-if="viewMode === 'transaction'">
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Pembeli</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">Total</TableHead>
              <TableHead class="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>

          <TableHeader v-else>
            <TableRow>
              <TableHead>Pembeli</TableHead>
              <TableHead>Jumlah Transaksi</TableHead>
              <TableHead>Belum Bayar</TableHead>
              <TableHead class="text-right">Total Hutang</TableHead>
              <TableHead class="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow v-if="isLoading">
              <TableCell :colspan="6" class="text-center text-muted-foreground">
                Memuat data...
              </TableCell>
            </TableRow>

            <template v-else-if="viewMode === 'transaction'">
              <TableRow v-if="!filteredTransactions.length">
                <TableCell :colspan="6" class="text-center text-muted-foreground">
                  {{ transactions.length ? 'Tidak ada transaksi untuk filter ini.' : 'Belum ada transaksi.' }}
                </TableCell>
              </TableRow>
              <TableRow v-for="transaction in filteredTransactions" :key="transaction.id">
                <TableCell>{{ formatDateTime(transaction.created_at) }}</TableCell>
                <TableCell class="font-medium">
                  {{ transaction.customers?.name ?? '-' }}
                </TableCell>
                <TableCell>{{ transaction.transaction_items.length }} item</TableCell>
                <TableCell>
                  <span
                    class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="transaction.is_paid
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'"
                  >
                    {{ transaction.is_paid ? 'Lunas' : 'Belum bayar' }}
                  </span>
                </TableCell>
                <TableCell class="text-right font-medium">
                  {{ formatPrice(transaction.total_amount) }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <Button
                      v-if="!transaction.is_paid"
                      size="sm"
                      :disabled="isPaying"
                      @click="openPaymentDialog(transaction)"
                    >
                      <Banknote class="size-4" />
                      Bayar
                    </Button>
                    <Button
                      v-if="!transaction.is_paid"
                      size="icon-sm"
                      variant="outline"
                      @click="openTransactionEdit(transaction)"
                    >
                      <Pencil class="size-4" />
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
                  {{ transactions.length ? 'Tidak ada transaksi untuk filter ini.' : 'Belum ada transaksi.' }}
                </TableCell>
              </TableRow>
              <TableRow
                v-for="summary in customerSummaries"
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
                    Lihat
                  </Button>
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
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
    </div>
  </DashboardLayout>
</template>
