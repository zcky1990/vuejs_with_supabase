<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  List,
  Monitor,
  PackagePlus,
  Receipt,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
} from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import ProfitTrendChart from '@/components/analytics/ProfitTrendChart.vue'
import { useI18n } from '@/composables/useI18n'
import { getDateRangePreset, getFullAnalyticsReport } from '@/lib/analytics'
import { getCurrentUser } from '@/lib/auth'
import { getActiveQueues } from '@/lib/queue'
import { getLowStockProducts } from '@/lib/stock'
import { formatPercent, formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  DailyAnalyticsRow,
  Product,
  ProductAnalyticsRow,
} from '@/types/database'

const LOW_STOCK_THRESHOLD = 5

const { t, locale } = useI18n()
const alertStore = useAlertStore()
const isLoading = ref(true)
const todaySummary = ref<AnalyticsSummary | null>(null)
const weekTrend = ref<DailyAnalyticsRow[]>([])
const topProductsToday = ref<ProductAnalyticsRow[]>([])
const lowStockProducts = ref<Product[]>([])
const queueWaiting = ref(0)
const queuePreparing = ref(0)
const queueReady = ref(0)
const queueServing = ref(0)

const userEmail = ref<string>('')

const dateLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'id-ID'))

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 11) return t('dashboard.greetingMorning')
  if (hour < 15) return t('dashboard.greetingAfternoon')
  if (hour < 18) return t('dashboard.greetingEvening')
  return t('dashboard.greetingNight')
})

const todayLabel = computed(() =>
  new Intl.DateTimeFormat(dateLocale.value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date()),
)

const activeQueueCount = computed(
  () => queueWaiting.value + queuePreparing.value + queueReady.value + queueServing.value,
)

const quickActions = computed(() => [
  { to: '/transactions', label: t('dashboard.actionNewTx'), icon: Receipt, description: t('dashboard.actionNewTxDesc') },
  { to: '/orders/inbox', label: t('dashboard.actionOrders'), icon: Inbox, description: t('dashboard.actionOrdersDesc') },
  { to: '/queue', label: t('dashboard.actionQueue'), icon: ClipboardList, description: t('dashboard.actionQueueDesc') },
  { to: '/transactions/list', label: t('dashboard.actionTxList'), icon: List, description: t('dashboard.actionTxListDesc') },
  { to: '/stock/restock', label: t('dashboard.actionRestock'), icon: PackagePlus, description: t('dashboard.actionRestockDesc') },
  { to: '/analytics', label: t('dashboard.actionAnalytics'), icon: BarChart3, description: t('dashboard.actionAnalyticsDesc') },
])

async function loadDashboard() {
  isLoading.value = true

  const { user } = await getCurrentUser()
  userEmail.value = user?.email ?? ''

  const todayRange = getDateRangePreset('today')
  const weekRange = getDateRangePreset('7d')

  const [todayResult, weekResult, queueResult, lowStockResult] = await Promise.all([
    getFullAnalyticsReport(todayRange),
    getFullAnalyticsReport(weekRange),
    getActiveQueues(),
    getLowStockProducts(LOW_STOCK_THRESHOLD),
  ])

  isLoading.value = false

  if (todayResult.error) {
    alertStore.showAlert(t('alert.error'), todayResult.error.message, 'error')
    return
  }

  if (weekResult.error) {
    alertStore.showAlert(t('alert.error'), weekResult.error.message, 'error')
    return
  }

  if (queueResult.error) {
    alertStore.showAlert(t('alert.error'), queueResult.error.message, 'error')
    return
  }

  if (lowStockResult.error) {
    alertStore.showAlert(t('alert.error'), lowStockResult.error.message, 'error')
    return
  }

  todaySummary.value = todayResult.summary
  topProductsToday.value = (todayResult.products ?? []).slice(0, 5)
  weekTrend.value = weekResult.dailyTrend ?? []
  lowStockProducts.value = lowStockResult.products ?? []

  const queues = queueResult.queues ?? []
  queueWaiting.value = queues.filter((queue) => queue.status === 'waiting').length
  queuePreparing.value = queues.filter((queue) => queue.status === 'preparing').length
  queueReady.value = queues.filter((queue) => queue.status === 'ready').length
  queueServing.value = queues.filter((queue) => queue.status === 'serving').length
}

onMounted(loadDashboard)
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6 p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <LayoutDashboard class="size-6" />
            {{ t('dashboard.title') }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ greeting }}{{ userEmail ? `, ${userEmail}` : '' }} · {{ todayLabel }}
          </p>
        </div>
        <Button variant="outline" :disabled="isLoading" @click="loadDashboard">
          <RefreshCw class="size-4" :class="{ 'animate-spin': isLoading }" />
          {{ t('common.refresh') }}
        </Button>
      </div>

      <div v-if="isLoading" class="py-16 text-center text-sm text-muted-foreground">
        {{ t('dashboard.loading') }}
      </div>

      <template v-else-if="todaySummary">
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card class="border-l-4 border-l-[var(--chart-1)]">
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium text-muted-foreground">{{ t('dashboard.revenueToday') }}</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-2xl font-bold">{{ formatPrice(todaySummary.revenue) }}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ todaySummary.transactionCount }} {{ t('dashboard.transactions') }}
              </p>
            </CardContent>
          </Card>

          <Card class="border-l-4 border-l-[var(--chart-3)]">
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium text-muted-foreground">{{ t('dashboard.grossProfitToday') }}</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-2xl font-bold">{{ formatPrice(todaySummary.grossProfit) }}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ t('dashboard.margin') }} {{ formatPercent(todaySummary.marginPercent) }}
              </p>
            </CardContent>
          </Card>

          <Card class="border-l-4 border-l-[var(--chart-4)]">
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium text-muted-foreground">{{ t('dashboard.paymentsToday') }}</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-2xl font-bold">{{ formatPrice(todaySummary.paidAmount) }}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ todaySummary.paidCount }} {{ t('dashboard.paid') }} · {{ todaySummary.unpaidCount }} {{ t('dashboard.unpaid') }}
              </p>
            </CardContent>
          </Card>

          <Card class="border-l-4 border-l-amber-500">
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium text-muted-foreground">{{ t('dashboard.debtQueue') }}</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-2xl font-bold">{{ formatPrice(todaySummary.outstandingDebt) }}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ activeQueueCount }} {{ t('dashboard.activeQueue') }}
                <span v-if="activeQueueCount">
                  ({{ queueWaiting }} {{ t('status.waiting').toLowerCase() }} · {{ queuePreparing }} {{ t('status.preparing').toLowerCase() }} · {{ queueReady }} {{ t('status.ready').toLowerCase() }} · {{ queueServing }} {{ t('status.serving').toLowerCase() }})
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 class="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {{ t('dashboard.quickActions') }}
          </h2>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <RouterLink
              v-for="action in quickActions"
              :key="action.to"
              :to="action.to"
              class="group rounded-xl border bg-background p-4 transition-colors hover:bg-muted/50"
            >
              <component :is="action.icon" class="mb-2 size-5 text-primary" />
              <p class="font-medium">{{ action.label }}</p>
              <p class="mt-1 text-xs text-muted-foreground">{{ action.description }}</p>
            </RouterLink>
            <RouterLink
              :to="{ name: 'queue-display' }"
              target="_blank"
              rel="noopener noreferrer"
              class="group rounded-xl border bg-background p-4 transition-colors hover:bg-muted/50"
            >
              <Monitor class="mb-2 size-5 text-primary" />
              <p class="font-medium">{{ t('dashboard.queueDisplay') }}</p>
              <p class="mt-1 text-xs text-muted-foreground">{{ t('dashboard.openTv') }}</p>
            </RouterLink>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-base">
                <ClipboardList class="size-4" />
                {{ t('dashboard.queueStatus') }}
              </CardTitle>
              <CardDescription>{{ t('dashboard.activeOrders') }}</CardDescription>
            </CardHeader>
            <CardContent>
              <div v-if="!activeQueueCount" class="text-sm text-muted-foreground">
                {{ t('dashboard.noActiveQueue') }}
              </div>
              <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div class="rounded-lg border bg-amber-500/10 px-3 py-4 text-center">
                  <p class="text-2xl font-bold">{{ queueWaiting }}</p>
                  <p class="text-xs text-muted-foreground">{{ t('status.waiting') }}</p>
                </div>
                <div class="rounded-lg border bg-blue-500/10 px-3 py-4 text-center">
                  <p class="text-2xl font-bold">{{ queuePreparing }}</p>
                  <p class="text-xs text-muted-foreground">{{ t('status.preparing') }}</p>
                </div>
                <div class="rounded-lg border bg-green-500/10 px-3 py-4 text-center">
                  <p class="text-2xl font-bold">{{ queueReady }}</p>
                  <p class="text-xs text-muted-foreground">{{ t('status.ready') }}</p>
                </div>
                <div class="rounded-lg border bg-violet-500/10 px-3 py-4 text-center">
                  <p class="text-2xl font-bold">{{ queueServing }}</p>
                  <p class="text-xs text-muted-foreground">{{ t('status.serving') }}</p>
                </div>
              </div>
              <Button class="mt-4 w-full" variant="outline" as-child>
                <RouterLink to="/queue">{{ t('dashboard.manageQueue') }}</RouterLink>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-base">
                <AlertTriangle class="size-4 text-amber-500" />
                {{ t('dashboard.lowStock') }}
              </CardTitle>
              <CardDescription>{{ t('dashboard.lowStockDesc', { threshold: LOW_STOCK_THRESHOLD }) }}</CardDescription>
            </CardHeader>
            <CardContent>
              <div v-if="!lowStockProducts.length" class="text-sm text-muted-foreground">
                {{ t('dashboard.stockSafe') }}
              </div>
              <ul v-else class="space-y-2">
                <li
                  v-for="product in lowStockProducts.slice(0, 5)"
                  :key="product.id"
                  class="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <span class="font-medium">{{ product.name }}</span>
                  <span class="text-muted-foreground">{{ t('dashboard.stockLabel', { quantity: product.stock_quantity }) }}</span>
                </li>
              </ul>
              <Button class="mt-4 w-full" variant="outline" as-child>
                <RouterLink to="/stock/restock">{{ t('dashboard.restockNow') }}</RouterLink>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div class="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-base">
                <ShoppingCart class="size-4" />
                {{ t('dashboard.topProducts') }}
              </CardTitle>
              <CardDescription>{{ t('dashboard.topProductsDesc') }}</CardDescription>
            </CardHeader>
            <CardContent>
              <div v-if="!topProductsToday.length" class="text-sm text-muted-foreground">
                {{ t('dashboard.noSalesToday') }}
              </div>
              <Table v-else>
                <TableHeader>
                  <TableRow>
                    <TableHead>{{ t('common.product') }}</TableHead>
                    <TableHead class="text-right">{{ t('dashboard.qty') }}</TableHead>
                    <TableHead class="text-right">{{ t('dashboard.profit') }}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="product in topProductsToday" :key="product.productId">
                    <TableCell class="font-medium">{{ product.productName }}</TableCell>
                    <TableCell class="text-right">{{ product.quantitySold }}</TableCell>
                    <TableCell class="text-right">{{ formatPrice(product.grossProfit) }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-base">
                <TrendingUp class="size-4" />
                {{ t('dashboard.trend7d') }}
              </CardTitle>
              <CardDescription>{{ t('dashboard.trendDesc') }}</CardDescription>
            </CardHeader>
            <CardContent>
              <div v-if="!weekTrend.length" class="text-sm text-muted-foreground">
                {{ t('dashboard.noChartData') }}
              </div>
              <ProfitTrendChart v-else :data="weekTrend" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-base">
              <Banknote class="size-4" />
              {{ t('dashboard.financeSummary') }}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p class="text-xs text-muted-foreground">{{ t('dashboard.inventoryValue') }}</p>
                <p class="text-lg font-semibold">{{ formatPrice(todaySummary.inventoryValue) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">{{ t('dashboard.outstandingDebt') }}</p>
                <p class="text-lg font-semibold">{{ formatPrice(todaySummary.outstandingDebt) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">{{ t('dashboard.cogsToday') }}</p>
                <p class="text-lg font-semibold">{{ formatPrice(todaySummary.cogs) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">{{ t('dashboard.unpaidToday') }}</p>
                <p class="text-lg font-semibold">{{ formatPrice(todaySummary.unpaidAmount) }}</p>
              </div>
            </div>
            <Button class="mt-4" variant="outline" as-child>
              <RouterLink to="/analytics">{{ t('dashboard.viewAnalytics') }}</RouterLink>
            </Button>
          </CardContent>
        </Card>
      </template>
    </div>
  </DashboardLayout>
</template>
