<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ClipboardCheck, RefreshCw } from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import StockOpnameFormDialog from '@/components/stock/StockOpnameFormDialog.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useI18n } from '@/composables/useI18n'
import { getProducts } from '@/lib/product'
import { getStockMovements } from '@/lib/stock'
import { useAlertStore } from '@/stores/useAlertStore'
import type { Product, StockMovementWithProduct } from '@/types/database'

const LOW_STOCK_THRESHOLD = 5
const HISTORY_LIMIT = 30

const { t, locale } = useI18n()
const alertStore = useAlertStore()
const products = ref<Product[]>([])
const recentMovements = ref<StockMovementWithProduct[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const lowStockOnly = ref(false)
const dialogOpen = ref(false)
const selectedProduct = ref<Product | null>(null)

const dateLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'id-ID'))

const filteredProducts = computed(() => {
  let result = products.value.filter((product) => product.is_active)

  if (lowStockOnly.value) {
    result = result.filter((product) => product.stock_quantity <= LOW_STOCK_THRESHOLD)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter((product) => {
      const name = product.name.toLowerCase()
      const sku = product.sku?.toLowerCase() ?? ''
      return name.includes(query) || sku.includes(query)
    })
  }

  return result.sort((a, b) => a.name.localeCompare(b.name, dateLocale.value))
})

function formatDate(value: string) {
  return new Intl.DateTimeFormat(dateLocale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDelta(movement: StockMovementWithProduct) {
  const delta = movement.stock_after - movement.stock_before
  if (delta > 0) return `+${delta}`
  if (delta < 0) return `${delta}`
  return '0'
}

function deltaClass(movement: StockMovementWithProduct) {
  const delta = movement.stock_after - movement.stock_before
  if (delta > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (delta < 0) return 'text-destructive'
  return 'text-muted-foreground'
}

function displayPerformer(movement: StockMovementWithProduct) {
  return movement.profiles?.full_name
    ?? movement.profiles?.email
    ?? '-'
}

async function loadData() {
  isLoading.value = true

  const [productsResult, movementsResult] = await Promise.all([
    getProducts(),
    getStockMovements({ movementType: 'opname', limit: HISTORY_LIMIT }),
  ])

  isLoading.value = false

  if (productsResult.error) {
    alertStore.showAlert(t('alert.error'), productsResult.error.message, 'error')
    return
  }

  if (movementsResult.error) {
    alertStore.showAlert(t('alert.error'), movementsResult.error.message, 'error')
    return
  }

  products.value = productsResult.products ?? []
  recentMovements.value = movementsResult.movements ?? []
}

function openOpnameDialog(product: Product) {
  selectedProduct.value = product
  dialogOpen.value = true
}

async function handleOpnameSaved() {
  await loadData()
}

onMounted(loadData)
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6 p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">{{ t('opname.title') }}</h1>
          <p class="text-sm text-muted-foreground">
            {{ t('opname.subtitle') }}
          </p>
        </div>
        <Button variant="outline" :disabled="isLoading" @click="loadData">
          <RefreshCw class="mr-2 size-4" :class="{ 'animate-spin': isLoading }" />
          {{ t('common.refresh') }}
        </Button>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          v-model="searchQuery"
          :placeholder="t('opname.search')"
          class="max-w-sm"
        />
        <label class="flex items-center gap-2 text-sm">
          <Switch v-model="lowStockOnly" />
          <span>{{ t('restock.lowStock', { threshold: LOW_STOCK_THRESHOLD }) }}</span>
        </label>
      </div>

      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t('common.product') }}</TableHead>
              <TableHead>{{ t('common.sku') }}</TableHead>
              <TableHead class="text-right">{{ t('opname.systemStock') }}</TableHead>
              <TableHead class="text-right">{{ t('common.actions') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading">
              <TableCell colspan="4" class="text-center text-muted-foreground">
                {{ t('common.loading') }}
              </TableCell>
            </TableRow>
            <TableRow v-else-if="!filteredProducts.length">
              <TableCell colspan="4" class="text-center text-muted-foreground">
                {{ t('opname.noProduct') }}
              </TableCell>
            </TableRow>
            <TableRow v-for="product in filteredProducts" :key="product.id">
              <TableCell class="font-medium">{{ product.name }}</TableCell>
              <TableCell>{{ product.sku || '-' }}</TableCell>
              <TableCell class="text-right font-medium">{{ product.stock_quantity }}</TableCell>
              <TableCell class="text-right">
                <Button size="sm" variant="outline" @click="openOpnameDialog(product)">
                  <ClipboardCheck class="mr-1 size-4" />
                  {{ t('opname.count') }}
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div class="space-y-3">
        <h2 class="text-lg font-semibold">{{ t('opname.history') }}</h2>
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ t('opname.time') }}</TableHead>
                <TableHead>{{ t('common.product') }}</TableHead>
                <TableHead class="text-right">{{ t('opname.systemStock') }}</TableHead>
                <TableHead class="text-right">{{ t('opname.physicalCount') }}</TableHead>
                <TableHead class="text-right">{{ t('opname.difference') }}</TableHead>
                <TableHead>{{ t('opname.performedBy') }}</TableHead>
                <TableHead>{{ t('opname.reason') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="isLoading">
                <TableCell colspan="7" class="text-center text-muted-foreground">
                  {{ t('opname.loadingHistory') }}
                </TableCell>
              </TableRow>
              <TableRow v-else-if="!recentMovements.length">
                <TableCell colspan="7" class="text-center text-muted-foreground">
                  {{ t('opname.noHistory') }}
                </TableCell>
              </TableRow>
              <TableRow v-for="movement in recentMovements" :key="movement.id">
                <TableCell>{{ formatDate(movement.created_at) }}</TableCell>
                <TableCell>{{ movement.products?.name ?? '-' }}</TableCell>
                <TableCell class="text-right text-muted-foreground">{{ movement.stock_before }}</TableCell>
                <TableCell class="text-right font-medium">{{ movement.stock_after }}</TableCell>
                <TableCell class="text-right font-medium" :class="deltaClass(movement)">
                  {{ formatDelta(movement) }}
                </TableCell>
                <TableCell>{{ displayPerformer(movement) }}</TableCell>
                <TableCell>{{ movement.notes || '-' }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>

    <StockOpnameFormDialog
      v-model:open="dialogOpen"
      :product="selectedProduct"
      @saved="handleOpnameSaved"
    />
  </DashboardLayout>
</template>
