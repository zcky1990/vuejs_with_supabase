<script setup lang="ts">
import { computed } from 'vue'
import { formatPreOrderItemWithAddons } from '@/lib/addon'
import { formatPrice } from '@/lib/format'
import { formatShopDateTime } from '@/lib/date'
import { useI18n } from '@/composables/useI18n'
import type { TableBookingStatus, TableBookingWithDetails } from '@/types/database'

const props = defineProps<{
  booking: TableBookingWithDetails
}>()

const { t } = useI18n()

const emit = defineEmits<{
  confirm: []
  checkIn: []
  cancel: []
}>()

const itemsSummary = computed(() => {
  const items = props.booking.pre_orders?.pre_order_items ?? []
  return items.map((item) => formatPreOrderItemWithAddons(item)).join(', ')
})

const statusClass: Record<TableBookingStatus, string> = {
  pending: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  confirmed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  checked_in: 'border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-300',
  completed: 'border-muted bg-muted text-muted-foreground',
  cancelled: 'border-muted bg-muted text-muted-foreground',
  no_show: 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300',
  expired: 'border-muted bg-muted text-muted-foreground',
}

const canConfirm = computed(() => props.booking.status === 'pending')
const canCheckIn = computed(() => ['pending', 'confirmed'].includes(props.booking.status))
const canCancel = computed(() => !['completed', 'cancelled', 'no_show', 'expired'].includes(props.booking.status))
</script>

<template>
  <article class="rounded-xl border bg-background p-4">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-lg font-semibold">
          {{ t('book.tableNumber', { number: booking.table_number }) }}
        </h3>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ formatShopDateTime(booking.scheduled_at) }}
          · {{ t('book.guests', { count: booking.party_size }) }}
        </p>
        <p v-if="booking.customer_name || booking.customer_phone" class="mt-1 text-sm text-muted-foreground">
          {{ booking.customer_name || t('order.noName') }}
          <span v-if="booking.customer_phone"> · {{ booking.customer_phone }}</span>
        </p>
      </div>
      <span class="rounded-md border px-2 py-1 text-xs font-medium" :class="statusClass[booking.status]">
        {{ t(`book.status.${booking.status}`) }}
      </span>
    </div>

    <p v-if="booking.pre_orders?.table_number?.includes(',')" class="mt-3 text-xs text-muted-foreground">
      {{ t('book.groupTables', { numbers: booking.pre_orders.table_number }) }}
    </p>

    <p class="mt-3 text-sm">
      {{ itemsSummary || '-' }}
    </p>

    <p
      v-if="booking.notes"
      class="mt-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
    >
      {{ booking.notes }}
    </p>

    <div class="mt-4 flex items-center justify-between gap-3">
      <p v-if="booking.pre_orders" class="font-semibold">
        {{ formatPrice(booking.pre_orders.total_amount) }}
      </p>
      <div class="ml-auto flex flex-wrap gap-2">
        <button
          v-if="canCancel"
          type="button"
          class="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
          @click="emit('cancel')"
        >
          {{ t('book.cancel') }}
        </button>
        <button
          v-if="canConfirm"
          type="button"
          class="inline-flex h-8 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 text-sm font-medium hover:bg-emerald-500/20"
          @click="emit('confirm')"
        >
          {{ t('book.confirm') }}
        </button>
        <button
          v-if="canCheckIn"
          type="button"
          class="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          @click="emit('checkIn')"
        >
          {{ t('book.checkIn') }}
        </button>
      </div>
    </div>
  </article>
</template>
