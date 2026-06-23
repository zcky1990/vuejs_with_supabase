<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Clock, RefreshCw, Wallet } from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/composables/useI18n'
import { getShopDateString } from '@/lib/date'
import { formatPrice } from '@/lib/format'
import {
  closeShift,
  getDayShiftSummary,
  getOpenShiftForCurrentUser,
  getShiftLiveTotals,
  openShift,
} from '@/lib/shift'
import { useAlertStore } from '@/stores/useAlertStore'
import type { CashierShift, ShiftLiveTotals } from '@/types/database'

const { t } = useI18n()
const alertStore = useAlertStore()

const isLoading = ref(true)
const selectedDate = ref(getShopDateString())
const openShiftRow = ref<CashierShift | null>(null)
const liveTotals = ref<ShiftLiveTotals | null>(null)
const dayShifts = ref<CashierShift[]>([])
const dayTotals = ref<{
  shiftCount: number
  closedCount: number
  totalSales: number
  cashSales: number
  cashVariance: number
  transactionCount: number
} | null>(null)

const openDialogOpen = ref(false)
const closeDialogOpen = ref(false)
const openingBalanceInput = ref('0')
const closingBalanceInput = ref('')
const closeNotes = ref('')
const isSubmitting = ref(false)

const expectedCash = computed(() => liveTotals.value?.expectedCashInDrawer ?? 0)
const closingVariance = computed(() => {
  const actual = Number(closingBalanceInput.value)
  if (!Number.isFinite(actual)) return null
  return actual - expectedCash.value
})

function formatDateTime(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function varianceClass(variance: number | null | undefined) {
  if (variance === null || variance === undefined) return ''
  if (variance === 0) return 'text-muted-foreground'
  return variance > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
}

async function loadOpenShift() {
  const { shift, error } = await getOpenShiftForCurrentUser()
  if (error) {
    alertStore.showAlert(t('alert.error'), String(error.message ?? error), 'error')
    openShiftRow.value = null
    liveTotals.value = null
    return
  }

  openShiftRow.value = shift
  if (!shift) {
    liveTotals.value = null
    return
  }

  const { totals, error: totalsError } = await getShiftLiveTotals(shift)
  if (totalsError) {
    alertStore.showAlert(t('alert.error'), String(totalsError.message ?? totalsError), 'error')
    liveTotals.value = null
    return
  }

  liveTotals.value = totals
}

async function loadDaySummary() {
  const { shifts, totals, error } = await getDayShiftSummary(selectedDate.value)
  if (error) {
    alertStore.showAlert(t('alert.error'), error.message, 'error')
    return
  }

  dayShifts.value = shifts
  dayTotals.value = totals
}

async function loadAll() {
  isLoading.value = true
  await Promise.all([loadOpenShift(), loadDaySummary()])
  isLoading.value = false
}

watch(selectedDate, () => {
  loadDaySummary()
})

onMounted(loadAll)

function openOpenDialog() {
  openingBalanceInput.value = '0'
  openDialogOpen.value = true
}

function openCloseDialog() {
  closingBalanceInput.value = String(expectedCash.value)
  closeNotes.value = ''
  closeDialogOpen.value = true
}

async function handleOpenShift() {
  const openingBalance = Number(openingBalanceInput.value)
  isSubmitting.value = true
  const { shift, error } = await openShift(openingBalance)
  isSubmitting.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), String(error.message ?? error), 'error')
    return
  }

  openDialogOpen.value = false
  alertStore.showAlert(t('alert.success'), t('shift.opened'), 'success')
  openShiftRow.value = shift
  await loadAll()
}

async function handleCloseShift() {
  if (!openShiftRow.value) return

  const closingBalanceActual = Number(closingBalanceInput.value)
  isSubmitting.value = true
  const { error } = await closeShift(openShiftRow.value.id, closingBalanceActual, closeNotes.value)
  isSubmitting.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), String(error.message ?? error), 'error')
    return
  }

  closeDialogOpen.value = false
  alertStore.showAlert(t('alert.success'), t('shift.closed'), 'success')
  openShiftRow.value = null
  liveTotals.value = null
  await loadAll()
}
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6 p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Wallet class="size-6" />
            {{ t('shift.title') }}
          </h1>
          <p class="text-sm text-muted-foreground">{{ t('shift.subtitle') }}</p>
        </div>
        <Button variant="outline" :disabled="isLoading" @click="loadAll">
          <RefreshCw class="mr-2 size-4" />
          {{ t('common.refresh') }}
        </Button>
      </div>

      <Card>
        <CardHeader class="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>{{ t('shift.currentShift') }}</CardTitle>
            <CardDescription>{{ t('shift.currentShiftDesc') }}</CardDescription>
          </div>
          <div class="flex gap-2">
            <Button v-if="!openShiftRow" @click="openOpenDialog">
              {{ t('shift.openShift') }}
            </Button>
            <Button v-else variant="destructive" @click="openCloseDialog">
              {{ t('shift.closeShift') }}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="isLoading" class="text-sm text-muted-foreground">
            {{ t('common.loading') }}
          </div>
          <div v-else-if="!openShiftRow" class="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            {{ t('shift.noOpenShift') }}
          </div>
          <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-lg border p-4">
              <p class="text-xs text-muted-foreground">{{ t('shift.openedAt') }}</p>
              <p class="mt-1 flex items-center gap-1 text-sm font-medium">
                <Clock class="size-4" />
                {{ formatDateTime(openShiftRow.opened_at) }}
              </p>
            </div>
            <div class="rounded-lg border p-4">
              <p class="text-xs text-muted-foreground">{{ t('shift.openingBalance') }}</p>
              <p class="mt-1 text-lg font-semibold">{{ formatPrice(openShiftRow.opening_balance) }}</p>
            </div>
            <div class="rounded-lg border p-4">
              <p class="text-xs text-muted-foreground">{{ t('shift.salesThisShift') }}</p>
              <p class="mt-1 text-lg font-semibold">{{ formatPrice(liveTotals?.totalSales ?? 0) }}</p>
              <p class="text-xs text-muted-foreground">
                {{ t('shift.transactionCount', { count: liveTotals?.transactionCount ?? 0 }) }}
              </p>
            </div>
            <div class="rounded-lg border p-4">
              <p class="text-xs text-muted-foreground">{{ t('shift.expectedCash') }}</p>
              <p class="mt-1 text-lg font-semibold">{{ formatPrice(liveTotals?.expectedCashInDrawer ?? openShiftRow.opening_balance) }}</p>
            </div>
            <div
              v-for="payment in liveTotals?.payments ?? []"
              :key="payment.method"
              class="rounded-lg border p-4 sm:col-span-2 lg:col-span-1"
            >
              <p class="text-xs text-muted-foreground">{{ payment.label }}</p>
              <p class="mt-1 font-semibold">{{ formatPrice(payment.amount) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>{{ t('shift.daySummary') }}</CardTitle>
            <CardDescription>{{ t('shift.daySummaryDesc') }}</CardDescription>
          </div>
          <Field class="w-full sm:w-auto">
            <FieldLabel for="shift-date">{{ t('shift.date') }}</FieldLabel>
            <Input id="shift-date" v-model="selectedDate" type="date" class="w-full sm:w-44" />
          </Field>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="dayTotals" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-lg border p-4">
              <p class="text-xs text-muted-foreground">{{ t('shift.closedShifts') }}</p>
              <p class="mt-1 text-lg font-semibold">{{ dayTotals.closedCount }} / {{ dayTotals.shiftCount }}</p>
            </div>
            <div class="rounded-lg border p-4">
              <p class="text-xs text-muted-foreground">{{ t('shift.totalSalesDay') }}</p>
              <p class="mt-1 text-lg font-semibold">{{ formatPrice(dayTotals.totalSales) }}</p>
            </div>
            <div class="rounded-lg border p-4">
              <p class="text-xs text-muted-foreground">{{ t('shift.cashSalesDay') }}</p>
              <p class="mt-1 text-lg font-semibold">{{ formatPrice(dayTotals.cashSales) }}</p>
            </div>
            <div class="rounded-lg border p-4">
              <p class="text-xs text-muted-foreground">{{ t('shift.totalVariance') }}</p>
              <p class="mt-1 text-lg font-semibold" :class="varianceClass(dayTotals.cashVariance)">
                {{ formatPrice(dayTotals.cashVariance) }}
              </p>
            </div>
          </div>

          <div v-if="!dayShifts.length" class="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            {{ t('shift.noShiftsForDate') }}
          </div>

          <Table v-else>
            <TableHeader>
              <TableRow>
                <TableHead>{{ t('shift.openedAt') }}</TableHead>
                <TableHead>{{ t('shift.closedAt') }}</TableHead>
                <TableHead class="text-right">{{ t('shift.openingBalance') }}</TableHead>
                <TableHead class="text-right">{{ t('shift.salesThisShift') }}</TableHead>
                <TableHead class="text-right">{{ t('shift.expectedCash') }}</TableHead>
                <TableHead class="text-right">{{ t('shift.actualCash') }}</TableHead>
                <TableHead class="text-right">{{ t('shift.variance') }}</TableHead>
                <TableHead>{{ t('common.status') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="shift in dayShifts" :key="shift.id">
                <TableCell>{{ formatDateTime(shift.opened_at) }}</TableCell>
                <TableCell>{{ formatDateTime(shift.closed_at) }}</TableCell>
                <TableCell class="text-right">{{ formatPrice(shift.opening_balance) }}</TableCell>
                <TableCell class="text-right">
                  {{ shift.total_sales === null ? '-' : formatPrice(shift.total_sales) }}
                </TableCell>
                <TableCell class="text-right">
                  {{ shift.closing_balance_expected === null ? '-' : formatPrice(shift.closing_balance_expected) }}
                </TableCell>
                <TableCell class="text-right">
                  {{ shift.closing_balance_actual === null ? '-' : formatPrice(shift.closing_balance_actual) }}
                </TableCell>
                <TableCell class="text-right" :class="varianceClass(shift.cash_variance)">
                  {{ shift.cash_variance === null ? '-' : formatPrice(shift.cash_variance) }}
                </TableCell>
                <TableCell>
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="shift.status === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-muted text-muted-foreground'"
                  >
                    {{ shift.status === 'open' ? t('shift.statusOpen') : t('shift.statusClosed') }}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="openDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('shift.openShift') }}</DialogTitle>
          <DialogDescription>{{ t('shift.openShiftDesc') }}</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel for="opening-balance">{{ t('shift.openingBalance') }}</FieldLabel>
          <Input
            id="opening-balance"
            v-model="openingBalanceInput"
            type="number"
            min="0"
            step="1000"
          />
        </Field>
        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">{{ t('common.cancel') }}</Button>
          </DialogClose>
          <Button :disabled="isSubmitting" @click="handleOpenShift">
            {{ isSubmitting ? t('common.saving') : t('shift.openShift') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="closeDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('shift.closeShift') }}</DialogTitle>
          <DialogDescription>{{ t('shift.closeShiftDesc') }}</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div class="rounded-lg border bg-muted/40 px-3 py-3 text-sm">
            <p>{{ t('shift.expectedCash') }}: <strong>{{ formatPrice(expectedCash) }}</strong></p>
            <p class="mt-1 text-muted-foreground">{{ t('shift.closeCashHint') }}</p>
          </div>
          <Field>
            <FieldLabel for="closing-balance">{{ t('shift.actualCash') }}</FieldLabel>
            <Input
              id="closing-balance"
              v-model="closingBalanceInput"
              type="number"
              min="0"
              step="1000"
            />
          </Field>
          <p v-if="closingVariance !== null" class="text-sm" :class="varianceClass(closingVariance)">
            {{ t('shift.variance') }}: {{ formatPrice(closingVariance) }}
          </p>
          <Field>
            <FieldLabel for="close-notes">{{ t('common.notes') }}</FieldLabel>
            <Textarea id="close-notes" v-model="closeNotes" :placeholder="t('common.optional')" rows="3" />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">{{ t('common.cancel') }}</Button>
          </DialogClose>
          <Button :disabled="isSubmitting" variant="destructive" @click="handleCloseShift">
            {{ isSubmitting ? t('common.saving') : t('shift.closeShift') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </DashboardLayout>
</template>
