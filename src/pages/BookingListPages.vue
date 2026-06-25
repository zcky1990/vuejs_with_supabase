<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { CalendarDays, Radio, RefreshCw, Users, Utensils, LayoutGrid } from '@lucide/vue'
import BookingCustomerSection from '@/components/booking/BookingCustomerSection.vue'
import BookingDetailDialog from '@/components/booking/BookingDetailDialog.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { useI18n } from '@/composables/useI18n'
import {
  cancelBooking,
  checkInBooking,
  confirmBooking,
  getBookings,
  groupBookingSections,
  groupBookingsByCustomer,
  subscribeTableBookings,
} from '@/lib/booking'
import { getShopDateString } from '@/lib/date'
import { useAlertStore } from '@/stores/useAlertStore'
import type { BookingCustomerGroup, TableBookingStatus, TableBookingWithDetails } from '@/types/database'

type StatusFilter = TableBookingStatus | 'all'

const { t } = useI18n()
const alertStore = useAlertStore()

const bookings = ref<TableBookingWithDetails[]>([])
const isLoading = ref(true)
const isRealtimeConnected = ref(false)
const filterDate = ref(getShopDateString())
const statusFilter = ref<StatusFilter>('confirmed')
const tableFilter = ref('')
const detailDialogOpen = ref(false)
const selectedGroup = ref<BookingCustomerGroup | null>(null)

let unsubscribeRealtime: (() => void) | null = null

const filteredBookings = computed(() => {
  let result = bookings.value

  if (filterDate.value) {
    result = result.filter((booking) => booking.booking_date === filterDate.value)
  }

  if (statusFilter.value !== 'all') {
    result = result.filter((booking) => booking.status === statusFilter.value)
  }

  const query = tableFilter.value.trim()
  if (query) {
    result = result.filter((booking) => booking.table_number.includes(query))
  }

  return result
})

const groupedBookings = computed(() => groupBookingsByCustomer(filteredBookings.value))

const bookingSections = computed(() => groupBookingSections(groupedBookings.value))

const listSummary = computed(() => {
  const groups = groupedBookings.value
  const guests = groups.reduce((sum, group) => sum + group.partySize, 0)
  const tables = new Set(groups.flatMap((group) => group.tableNumbers)).size
  return {
    reservations: groups.length,
    customers: bookingSections.value.length,
    guests,
    tables,
  }
})

async function loadBookings(options?: { silent?: boolean }) {
  if (!options?.silent) {
    isLoading.value = true
  }

  const { bookings: data, error } = await getBookings({
    fromDate: filterDate.value,
    status: statusFilter.value === 'all' ? undefined : statusFilter.value,
  })

  isLoading.value = false

  if (error) {
    if (!options?.silent) {
      alertStore.showAlert(t('alert.error'), error.message, 'error')
    }
    return
  }

  bookings.value = data ?? []
}

async function handleConfirm(bookingId: string) {
  const { error } = await confirmBooking(bookingId)
  if (error) {
    alertStore.showAlert(t('alert.error'), error.message, 'error')
    return
  }

  alertStore.showAlert(t('alert.success'), t('book.confirmed'), 'success')
  await loadBookings({ silent: true })
}

async function handleCheckIn(bookingId: string) {
  if (!confirm(t('book.checkInConfirm'))) return

  const { queueNumber, error } = await checkInBooking(bookingId)
  if (error) {
    const message = typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : t('book.checkInFailed')
    alertStore.showAlert(t('alert.error'), message, 'error')
    return
  }

  const detail = queueNumber != null
    ? t('book.checkInSuccessQueue', { number: queueNumber })
    : t('book.checkInSuccess')
  alertStore.showAlert(t('alert.success'), detail, 'success')
  await loadBookings({ silent: true })
}

async function handleCancel(bookingId: string) {
  if (!confirm(t('book.cancelConfirm'))) return

  const { error } = await cancelBooking(bookingId)
  if (error) {
    const message = typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : t('book.cancelFailed')
    alertStore.showAlert(t('alert.error'), message, 'error')
    return
  }

  alertStore.showAlert(t('alert.success'), t('book.cancelled'), 'success')
  await loadBookings({ silent: true })
}

function primaryBookingId(group: BookingCustomerGroup) {
  return group.bookings[0]?.id
}

function openDetailDialog(group: BookingCustomerGroup) {
  selectedGroup.value = group
  detailDialogOpen.value = true
}

async function handleGroupConfirm(group: BookingCustomerGroup) {
  const bookingId = primaryBookingId(group)
  if (!bookingId) return
  await handleConfirm(bookingId)
  detailDialogOpen.value = false
}

async function handleGroupCheckIn(group: BookingCustomerGroup) {
  const bookingId = primaryBookingId(group)
  if (!bookingId) return
  await handleCheckIn(bookingId)
  detailDialogOpen.value = false
}

async function handleGroupCancel(group: BookingCustomerGroup) {
  const bookingId = primaryBookingId(group)
  if (!bookingId) return
  await handleCancel(bookingId)
  detailDialogOpen.value = false
}

onMounted(async () => {
  await loadBookings()

  unsubscribeRealtime = subscribeTableBookings(
    () => loadBookings({ silent: true }),
    (status) => {
      isRealtimeConnected.value = status === 'SUBSCRIBED'
    },
    'staff_bookings',
  )
})

onUnmounted(() => {
  unsubscribeRealtime?.()
  unsubscribeRealtime = null
})
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6 p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <CalendarDays class="size-6" />
            {{ t('book.listTitle') }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ t('book.listSubtitle') }}
            <span
              v-if="isRealtimeConnected"
              class="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300"
            >
              <Radio class="size-3" />
              {{ t('common.live') }}
            </span>
          </p>
        </div>
        <Button variant="outline" :disabled="isLoading" @click="loadBookings()">
          <RefreshCw class="size-4" :class="{ 'animate-spin': isLoading }" />
          {{ t('common.refresh') }}
        </Button>
      </div>

      <Card class="gap-0 py-0">
        <CardHeader class="border-b px-4 py-4">
          <CardTitle class="text-base">{{ t('book.filterTitle') }}</CardTitle>
          <CardDescription>{{ t('book.filterDesc') }}</CardDescription>
        </CardHeader>
        <CardContent class="p-4">
          <FieldGroup class="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel for="booking-filter-date">{{ t('book.filterDate') }}</FieldLabel>
              <Input
                id="booking-filter-date"
                v-model="filterDate"
                type="date"
                class="w-full"
                @change="loadBookings()"
              />
            </Field>
            <Field>
              <FieldLabel for="booking-filter-status">{{ t('book.filterStatus') }}</FieldLabel>
              <Select v-model="statusFilter" @update:model-value="loadBookings()">
                <SelectTrigger id="booking-filter-status" class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{{ t('common.all') }}</SelectItem>
                  <SelectItem value="pending">{{ t('book.status.pending') }}</SelectItem>
                  <SelectItem value="confirmed">{{ t('book.status.confirmed') }}</SelectItem>
                  <SelectItem value="checked_in">{{ t('book.status.checked_in') }}</SelectItem>
                  <SelectItem value="completed">{{ t('book.status.completed') }}</SelectItem>
                  <SelectItem value="cancelled">{{ t('book.status.cancelled') }}</SelectItem>
                  <SelectItem value="no_show">{{ t('book.status.no_show') }}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel for="booking-filter-table">{{ t('book.filterTable') }}</FieldLabel>
              <Input
                id="booking-filter-table"
                v-model="tableFilter"
                :placeholder="t('book.filterTablePh')"
                class="w-full"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div
        v-if="!isLoading && bookingSections.length"
        class="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4"
      >
        <div class="flex items-center gap-3 bg-card px-4 py-3">
          <Users class="size-4 text-muted-foreground" />
          <div>
            <p class="text-xs text-muted-foreground">{{ t('book.statCustomers') }}</p>
            <p class="text-lg font-semibold tabular-nums">{{ listSummary.customers }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 bg-card px-4 py-3 sm:border-l">
          <CalendarDays class="size-4 text-muted-foreground" />
          <div>
            <p class="text-xs text-muted-foreground">{{ t('book.statReservations') }}</p>
            <p class="text-lg font-semibold tabular-nums">{{ listSummary.reservations }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 bg-card px-4 py-3 lg:border-l">
          <Utensils class="size-4 text-muted-foreground" />
          <div>
            <p class="text-xs text-muted-foreground">{{ t('book.statGuests') }}</p>
            <p class="text-lg font-semibold tabular-nums">{{ listSummary.guests }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 bg-card px-4 py-3 sm:border-l lg:border-l">
          <LayoutGrid class="size-4 text-muted-foreground" />
          <div>
            <p class="text-xs text-muted-foreground">{{ t('book.statTables') }}</p>
            <p class="text-lg font-semibold tabular-nums">{{ listSummary.tables }}</p>
          </div>
        </div>
      </div>

      <Card v-if="isLoading" class="gap-0 py-0">
        <CardContent class="space-y-3 p-4">
          <Skeleton class="h-24 w-full rounded-lg" />
          <Skeleton class="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>

      <Card
        v-else-if="!bookingSections.length"
        class="gap-0 border-dashed py-0"
      >
        <CardContent class="px-4 py-12 text-center text-sm text-muted-foreground">
          {{ t('book.noBookings') }}
        </CardContent>
      </Card>

      <div v-else class="grid gap-4 xl:grid-cols-2">
        <BookingCustomerSection
          v-for="section in bookingSections"
          :key="section.customerKey"
          :section="section"
          @view-detail="openDetailDialog"
          @confirm="handleGroupConfirm"
          @check-in="handleGroupCheckIn"
          @cancel="handleGroupCancel"
        />
      </div>

      <BookingDetailDialog
        v-model:open="detailDialogOpen"
        :group="selectedGroup"
        @confirm="selectedGroup && handleGroupConfirm(selectedGroup)"
        @check-in="selectedGroup && handleGroupCheckIn(selectedGroup)"
        @cancel="selectedGroup && handleGroupCancel(selectedGroup)"
      />
    </div>
  </DashboardLayout>
</template>
