<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { CalendarDays, Radio } from '@lucide/vue'
import BookingCard from '@/components/booking/BookingCard.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  subscribeTableBookings,
} from '@/lib/booking'
import { getShopDateString } from '@/lib/date'
import { useAlertStore } from '@/stores/useAlertStore'
import type { TableBookingStatus, TableBookingWithDetails } from '@/types/database'

type StatusFilter = TableBookingStatus | 'all'

const { t } = useI18n()
const alertStore = useAlertStore()

const bookings = ref<TableBookingWithDetails[]>([])
const isLoading = ref(true)
const isRealtimeConnected = ref(false)
const filterDate = ref(getShopDateString())
const statusFilter = ref<StatusFilter>('all')
const tableFilter = ref('')

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
          {{ t('common.refresh') }}
        </Button>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div class="space-y-1">
          <label class="text-xs font-medium text-muted-foreground">{{ t('book.filterDate') }}</label>
          <Input v-model="filterDate" type="date" class="w-full sm:w-44" @change="loadBookings()" />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium text-muted-foreground">{{ t('book.filterStatus') }}</label>
          <Select v-model="statusFilter" @update:model-value="loadBookings()">
            <SelectTrigger class="w-full sm:w-44">
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
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium text-muted-foreground">{{ t('book.filterTable') }}</label>
          <Input v-model="tableFilter" :placeholder="t('book.filterTablePh')" class="w-full sm:w-36" />
        </div>
      </div>

      <div v-if="isLoading" class="text-sm text-muted-foreground">
        {{ t('book.loadingList') }}
      </div>

      <div
        v-else-if="!filteredBookings.length"
        class="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground"
      >
        {{ t('book.noBookings') }}
      </div>

      <div v-else class="grid gap-4">
        <BookingCard
          v-for="booking in filteredBookings"
          :key="booking.id"
          :booking="booking"
          @confirm="handleConfirm(booking.id)"
          @check-in="handleCheckIn(booking.id)"
          @cancel="handleCancel(booking.id)"
        />
      </div>
    </div>
  </DashboardLayout>
</template>
