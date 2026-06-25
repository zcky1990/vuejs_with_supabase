<script setup lang="ts">
import { computed } from 'vue'
import { CalendarClock, Phone, Users } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { formatPreOrderItemWithAddons } from '@/lib/addon'
import { formatShopDateTime } from '@/lib/date'
import { formatPrice } from '@/lib/format'
import { useI18n } from '@/composables/useI18n'
import type { BookingCustomerGroup, TableBookingStatus } from '@/types/database'

const props = defineProps<{
  open: boolean
  group: BookingCustomerGroup | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  checkIn: []
  cancel: []
}>()

const { t } = useI18n()

const statusBadgeClass: Record<TableBookingStatus, string> = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  confirmed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  checked_in: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  completed: 'border-border bg-muted text-muted-foreground',
  cancelled: 'border-border bg-muted text-muted-foreground',
  no_show: 'border-destructive/30 bg-destructive/10 text-destructive',
  expired: 'border-border bg-muted text-muted-foreground',
}

const items = computed(() => props.group?.preOrder?.pre_order_items ?? [])

const canConfirm = computed(() => props.group?.status === 'pending')
const canCheckIn = computed(() => ['pending', 'confirmed'].includes(props.group?.status ?? ''))
const canCancel = computed(() => !['checked_in', 'completed', 'cancelled', 'no_show', 'expired'].includes(props.group?.status ?? ''))

const displayName = computed(() => props.group?.customerName || t('order.noName'))
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-[540px]">
      <DialogHeader class="space-y-2 border-b px-6 py-4">
        <DialogTitle>{{ t('book.detailTitle') }}</DialogTitle>
        <DialogDescription>
          {{ displayName }}
          <span v-if="group?.customerPhone"> · {{ group.customerPhone }}</span>
        </DialogDescription>
      </DialogHeader>

      <div v-if="group" class="space-y-4 px-6 py-4">
        <Card class="gap-0 py-0 shadow-none">
          <CardHeader class="px-4 py-4">
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-2 text-sm">
                <p class="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock class="size-4 shrink-0" />
                  <span>{{ formatShopDateTime(group.scheduledAt) }}</span>
                </p>
                <p class="flex items-center gap-2 text-muted-foreground">
                  <Users class="size-4 shrink-0" />
                  <span>{{ t('book.guests', { count: group.partySize }) }}</span>
                </p>
                <p
                  v-if="group.customerPhone"
                  class="flex items-center gap-2 text-muted-foreground"
                >
                  <Phone class="size-4 shrink-0" />
                  <span>{{ group.customerPhone }}</span>
                </p>
              </div>
              <span
                class="inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                :class="statusBadgeClass[group.status]"
              >
                {{ t(`book.status.${group.status}`) }}
              </span>
            </div>
            <div class="flex flex-wrap gap-1.5 pt-1">
              <span
                v-for="tableNumber in group.tableNumbers"
                :key="tableNumber"
                class="inline-flex items-center rounded-md border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {{ t('book.tableChip', { number: tableNumber }) }}
              </span>
            </div>
          </CardHeader>
        </Card>

        <div class="space-y-2">
          <p class="text-sm font-medium">{{ t('book.detailMenu') }}</p>
          <div
            v-if="!items.length"
            class="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground"
          >
            {{ t('book.noPreOrderItems') }}
          </div>
          <div
            v-for="item in items"
            :key="item.id"
            class="flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm"
          >
            <span>{{ formatPreOrderItemWithAddons(item) }}</span>
            <span class="shrink-0 font-medium tabular-nums">{{ formatPrice(item.subtotal) }}</span>
          </div>
        </div>

        <p
          v-if="group.notes"
          class="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
        >
          {{ group.notes }}
        </p>

        <Separator />

        <div
          v-if="group.preOrder"
          class="flex items-center justify-between"
        >
          <span class="text-sm text-muted-foreground">{{ t('common.total') }}</span>
          <span class="text-xl font-semibold tabular-nums tracking-tight">
            {{ formatPrice(group.preOrder.total_amount) }}
          </span>
        </div>
      </div>

      <DialogFooter class="gap-2 border-t px-6 py-4 sm:justify-between">
        <DialogClose as-child>
          <Button type="button" variant="outline">{{ t('common.close') }}</Button>
        </DialogClose>
        <div v-if="group" class="flex flex-wrap gap-2 sm:ml-auto">
          <Button
            v-if="canCancel"
            type="button"
            variant="outline"
            @click="emit('cancel')"
          >
            {{ t('book.cancel') }}
          </Button>
          <Button
            v-if="canConfirm"
            type="button"
            variant="secondary"
            @click="emit('confirm')"
          >
            {{ t('book.confirm') }}
          </Button>
          <Button
            v-if="canCheckIn"
            type="button"
            @click="emit('checkIn')"
          >
            {{ t('book.checkIn') }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
