<script setup lang="ts">
import { computed } from 'vue'
import {
  CalendarClock,
  Eye,
  LogIn,
  Users,
  UtensilsCrossed,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatPreOrderItemWithAddons } from '@/lib/addon'
import { formatShopDate, formatShopTime } from '@/lib/date'
import { formatPrice } from '@/lib/format'
import { useI18n } from '@/composables/useI18n'
import type { BookingCustomerGroup, TableBookingStatus } from '@/types/database'

const props = withDefaults(
  defineProps<{
    group: BookingCustomerGroup
    showDate?: boolean
  }>(),
  {
    showDate: false,
  },
)

const emit = defineEmits<{
  viewDetail: []
  confirm: []
  checkIn: []
  cancel: []
}>()

const { t, locale } = useI18n()

const statusBadgeClass: Record<TableBookingStatus, string> = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  confirmed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  checked_in: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  completed: 'border-border bg-muted text-muted-foreground',
  cancelled: 'border-border bg-muted text-muted-foreground',
  no_show: 'border-destructive/30 bg-destructive/10 text-destructive',
  expired: 'border-border bg-muted text-muted-foreground',
}

const itemCount = computed(() => props.group.preOrder?.pre_order_items.length ?? 0)

const menuPreview = computed(() => {
  const items = props.group.preOrder?.pre_order_items ?? []
  const preview = items.slice(0, 2).map((item) => formatPreOrderItemWithAddons(item))
  const remaining = Math.max(0, items.length - preview.length)
  return { preview, remaining }
})

const scheduleTime = computed(() =>
  formatShopTime(props.group.scheduledAt, locale.value === 'en' ? 'en' : 'id'),
)

const scheduleDate = computed(() =>
  formatShopDate(props.group.scheduledAt, locale.value === 'en' ? 'en' : 'id'),
)

const canConfirm = computed(() => props.group.status === 'pending')
const canCheckIn = computed(() => ['pending', 'confirmed'].includes(props.group.status))
const canCancel = computed(() => !['checked_in', 'completed', 'cancelled', 'no_show', 'expired'].includes(props.group.status))
</script>

<template>
  <div class="px-4 py-4">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="flex min-w-0 flex-1 gap-4">
        <div
          class="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg border bg-muted/50 px-2"
        >
          <span class="text-lg font-semibold tabular-nums leading-none">{{ scheduleTime }}</span>
          <span
            v-if="showDate"
            class="mt-1 text-[10px] font-medium text-muted-foreground"
          >
            {{ scheduleDate }}
          </span>
        </div>

        <div class="min-w-0 flex-1 space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
              :class="statusBadgeClass[group.status]"
            >
              {{ t(`book.status.${group.status}`) }}
            </span>
            <CardDescription class="inline-flex items-center gap-1 text-xs">
              <Users class="size-3.5" />
              {{ t('book.guests', { count: group.partySize }) }}
            </CardDescription>
            <CardDescription
              v-if="showDate"
              class="inline-flex items-center gap-1 text-xs"
            >
              <CalendarClock class="size-3.5" />
              {{ scheduleDate }}
            </CardDescription>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="tableNumber in group.tableNumbers"
              :key="tableNumber"
              class="inline-flex items-center rounded-md border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {{ t('book.tableChip', { number: tableNumber }) }}
            </span>
          </div>

          <div
            v-if="group.preOrder && menuPreview.preview.length"
            class="rounded-lg border bg-muted/40 p-3"
          >
            <p class="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <UtensilsCrossed class="size-3.5" />
              {{ t('book.detailMenu') }}
            </p>
            <ul class="space-y-1 text-sm">
              <li
                v-for="(line, index) in menuPreview.preview"
                :key="index"
                class="truncate"
              >
                {{ line }}
              </li>
              <li
                v-if="menuPreview.remaining > 0"
                class="text-xs text-muted-foreground"
              >
                {{ t('book.menuPreviewMore', { count: menuPreview.remaining }) }}
              </li>
            </ul>
          </div>

          <p
            v-else-if="!group.preOrder || !itemCount"
            class="text-sm text-muted-foreground"
          >
            {{ t('book.noPreOrderItems') }}
          </p>

          <p
            v-if="group.notes"
            class="line-clamp-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
          >
            {{ group.notes }}
          </p>
        </div>
      </div>

      <div
        v-if="group.preOrder"
        class="shrink-0 text-left lg:text-right"
      >
        <p class="text-xs text-muted-foreground">{{ t('book.itemCount', { count: itemCount }) }}</p>
        <p class="text-xl font-semibold tabular-nums tracking-tight">
          {{ formatPrice(group.preOrder.total_amount) }}
        </p>
      </div>
    </div>

    <Separator class="my-4" />

    <div class="flex flex-wrap items-center justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        @click="emit('viewDetail')"
      >
        <Eye class="size-3.5" />
        {{ t('book.viewDetail') }}
      </Button>
      <Button
        v-if="canCancel"
        size="sm"
        variant="outline"
        @click="emit('cancel')"
      >
        {{ t('book.cancel') }}
      </Button>
      <Button
        v-if="canConfirm"
        size="sm"
        variant="secondary"
        @click="emit('confirm')"
      >
        {{ t('book.confirm') }}
      </Button>
      <Button
        v-if="canCheckIn"
        size="sm"
        @click="emit('checkIn')"
      >
        <LogIn class="size-3.5" />
        {{ t('book.checkIn') }}
      </Button>
    </div>
  </div>
</template>
