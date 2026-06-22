<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { AlertTriangle, RefreshCw } from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { getDateRangePreset, getFullAnalyticsReport } from '@/lib/analytics'
import { getLowStockProducts } from '@/lib/stock'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAlertStore } from '@/stores/useAlertStore'
import type {
  AnalyticsSummary,
  DateRangePreset,
  PaymentBreakdownRow,
  Product,
  ProductAnalyticsRow,
} from '@/types/database'

const LOW_STOCK_THRESHOLD = 5

const alertStore = useAlertStore()
const isLoading = ref(true)
const activePreset = ref<DateRangePreset>('month')
const customStart = ref('')
const customEnd = ref('')
const showAllProducts = ref(false)

const summary = ref<AnalyticsSummary | null>(null)
const products = ref<ProductAnalyticsRow[]>([])
const payments = ref<PaymentBreakdownRow[]>([])
const lowStockProducts = ref<Product[]>([])

const presetOptions: { value: DateRangePreset, label: string }[] = [
  { value: 'today', label: 'Hari ini' },
  { value: '7d', label: '7 hari' },
  { value: 'month', label: 'Bulan ini' },
  { value: '30d', label: '30 hari' },
]

const displayedProducts = computed(() => {
  if (showAllProducts.value) return products.value
  return products.value.slice(0, 10)
})

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function getCurrentRange() {
  if (activePreset.value === 'custom') {
    const start = customStart.value ? new Date(customStart.value) : new Date()
    const end = customEnd.value ? new Date(customEnd.value) : new Date()
    return getDateRangePreset('custom', start, end)
  }

  return getDateRangePreset(activePreset.value)
}

function setPreset(preset: DateRangePreset) {
  activePreset.value = preset
}

async function loadAnalytics() {
  isLoading.value = true
  const range = getCurrentRange()

  const [reportResult, lowStockResult] = await Promise.all([
    getFullAnalyticsReport(range),
    getLowStockProducts(LOW_STOCK_THRESHOLD),
  ])

  isLoading.value = false

  if (reportResult.error) {
    alertStore.showAlert('Error', reportResult.error.message, 'error')
    return
  }

  if (lowStockResult.error) {
    alertStore.showAlert('Error', lowStockResult.error.message, 'error')
    return
  }

  summary.value = reportResult.summary
  products.value = reportResult.products ?? []
  payments.value = reportResult.payments ?? []
  lowStockProducts.value = lowStockResult.products ?? []
}

watch(activePreset, () => {
  if (activePreset.value === 'custom' && (!customStart.value || !customEnd.value)) {
    return
  }
  loadAnalytics()
})

watch([customStart, customEnd], () => {
  if (activePreset.value !== 'custom') return
  if (!customStart.value || !customEnd.value) return
  loadAnalytics()
})

onMounted(() => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  customStart.value = monthStart.toISOString().slice(0, 10)
  customEnd.value = now.toISOString().slice(0, 10)
  loadAnalytics()
})
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6 p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Analisis Keuntungan</h1>
          <p class="text-sm text-muted-foreground">
            Ringkasan laba kotor berdasarkan tanggal transaksi dibuat.
          </p>
        </div>
        <Button variant="outline" :disabled="isLoading" @click="loadAnalytics">
          <RefreshCw class="mr-2 size-4" :class="{ 'animate-spin': isLoading }" />
          Refresh
        </Button>
      </div>

      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="option in presetOptions"
            :key="option.value"
            size="sm"
            :variant="activePreset === option.value ? 'default' : 'outline'"
            @click="setPreset(option.value)"
          >
            {{ option.label }}
          </Button>
          <Button
            size="sm"
            :variant="activePreset === 'custom' ? 'default' : 'outline'"
            @click="activePreset = 'custom'"
          >
            Custom
          </Button>
        </div>
        <div v-if="activePreset === 'custom'" class="flex flex-wrap items-center gap-2">
          <Input v-model="customStart" type="date" class="w-auto" />
          <span class="text-sm text-muted-foreground">s/d</span>
          <Input v-model="customEnd" type="date" class="w-auto" />
        </div>
      </div>

      <div
        v-if="summary && summary.salesWithoutCogsCount > 0"
        class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
      >
        <AlertTriangle class="mt-0.5 size-4 shrink-0" />
        <span>
          {{ summary.salesWithoutCogsCount }} transaksi dalam periode ini belum memiliki data HPP
          (kemungkinan transaksi lama sebelum costing FIFO).
        </span>
      </div>

      <div v-if="isLoading" class="text-center text-muted-foreground py-8">
        Memuat analisis...
      </div>

      <template v-else-if="summary">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium text-muted-foreground">Pendapatan</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-2xl font-bold">{{ formatPrice(summary.revenue) }}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium text-muted-foreground">HPP (FIFO)</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-2xl font-bold">{{ formatPrice(summary.cogs) }}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium text-muted-foreground">Laba kotor</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                class="text-2xl font-bold"
                :class="summary.grossProfit >= 0 ? 'text-green-600' : 'text-destructive'"
              >
                {{ formatPrice(summary.grossProfit) }}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium text-muted-foreground">Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-2xl font-bold">{{ formatPercent(summary.marginPercent) }}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium text-muted-foreground">Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-2xl font-bold">{{ summary.transactionCount }}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                Lunas: {{ summary.paidCount }} ({{ formatPrice(summary.paidAmount) }}) ·
                Hutang: {{ summary.unpaidCount }} ({{ formatPrice(summary.unpaidAmount) }})
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium text-muted-foreground">Restock keluar</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-2xl font-bold">{{ formatPrice(summary.restockSpend) }}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium text-muted-foreground">Piutang</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-2xl font-bold text-amber-600">{{ formatPrice(summary.outstandingDebt) }}</p>
              <p class="mt-1 text-xs text-muted-foreground">Total hutang belum lunas (saat ini)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium text-muted-foreground">Nilai stok</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-2xl font-bold">{{ formatPrice(summary.inventoryValue) }}</p>
              <p class="mt-1 text-xs text-muted-foreground">Inventaris FIFO saat ini</p>
            </CardContent>
          </Card>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Produk</h2>
            <Button
              v-if="products.length > 10"
              variant="ghost"
              size="sm"
              @click="showAllProducts = !showAllProducts"
            >
              {{ showAllProducts ? 'Tampilkan top 10' : `Tampilkan semua (${products.length})` }}
            </Button>
          </div>
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead class="text-right">Qty terjual</TableHead>
                  <TableHead class="text-right">Pendapatan</TableHead>
                  <TableHead class="text-right">HPP</TableHead>
                  <TableHead class="text-right">Laba</TableHead>
                  <TableHead class="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="!displayedProducts.length">
                  <TableCell colspan="6" class="text-center text-muted-foreground">
                    Belum ada penjualan dalam periode ini.
                  </TableCell>
                </TableRow>
                <TableRow v-for="row in displayedProducts" :key="row.productId">
                  <TableCell class="font-medium">{{ row.productName }}</TableCell>
                  <TableCell class="text-right">{{ row.quantitySold }}</TableCell>
                  <TableCell class="text-right">{{ formatPrice(row.revenue) }}</TableCell>
                  <TableCell class="text-right">{{ formatPrice(row.cogs) }}</TableCell>
                  <TableCell
                    class="text-right font-medium"
                    :class="row.grossProfit >= 0 ? 'text-green-600' : 'text-destructive'"
                  >
                    {{ formatPrice(row.grossProfit) }}
                  </TableCell>
                  <TableCell class="text-right">{{ formatPercent(row.marginPercent) }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <div class="space-y-3">
          <h2 class="text-lg font-semibold">Metode pembayaran (lunas)</h2>
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metode</TableHead>
                  <TableHead class="text-right">Jumlah transaksi</TableHead>
                  <TableHead class="text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="!payments.length">
                  <TableCell colspan="3" class="text-center text-muted-foreground">
                    Belum ada pembayaran lunas dalam periode ini.
                  </TableCell>
                </TableRow>
                <TableRow v-for="row in payments" :key="row.method">
                  <TableCell class="font-medium">{{ row.label }}</TableCell>
                  <TableCell class="text-right">{{ row.transactionCount }}</TableCell>
                  <TableCell class="text-right">{{ formatPrice(row.amount) }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <div class="space-y-3">
          <h2 class="text-lg font-semibold">Stok menipis (&le; {{ LOW_STOCK_THRESHOLD }})</h2>
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead class="text-right">Stok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="!lowStockProducts.length">
                  <TableCell colspan="3" class="text-center text-muted-foreground">
                    Semua produk stoknya cukup.
                  </TableCell>
                </TableRow>
                <TableRow v-for="product in lowStockProducts" :key="product.id">
                  <TableCell class="font-medium">{{ product.name }}</TableCell>
                  <TableCell>{{ product.sku || '-' }}</TableCell>
                  <TableCell class="text-right font-semibold text-destructive">
                    {{ product.stock_quantity }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </template>
    </div>
  </DashboardLayout>
</template>
