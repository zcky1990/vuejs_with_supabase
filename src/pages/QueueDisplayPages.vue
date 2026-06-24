<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getQueueStatusLabel } from '@/composables/useActiveQueues'
import { useI18n } from '@/composables/useI18n'
import { formatItemWithAddons } from '@/lib/addon'
import { formatQueueNumber } from '@/lib/format'
import { getActiveQueues, subscribeActiveQueues } from '@/lib/queue'
import { WALK_IN_CUSTOMER_NAME } from '@/types/database'
import type { OrderQueueWithDetails } from '@/types/database'

const { t } = useI18n()
const queues = ref<OrderQueueWithDetails[]>([])
const isLoading = ref(true)

let unsubscribeRealtime: (() => void) | null = null

const statusClass = {
  waiting: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  preparing: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200',
  ready: 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200',
  serving: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
} as const

function displayCustomerName(name: string | undefined | null) {
  if (!name) return '-'
  if (name === WALK_IN_CUSTOMER_NAME) return t('common.walkIn')
  return name
}

function formatItems(queue: OrderQueueWithDetails) {
  return (queue.transactions?.transaction_items ?? [])
    .map((item) => formatItemWithAddons(item))
    .join(', ')
}

async function loadQueues(options?: { silent?: boolean }) {
  if (!options?.silent) {
    isLoading.value = true
  }

  const { queues: data, error } = await getActiveQueues()
  isLoading.value = false

  if (!error) {
    queues.value = data ?? []
  }
}

onMounted(async () => {
  await loadQueues()

  unsubscribeRealtime = subscribeActiveQueues(
    () => loadQueues({ silent: true }),
    undefined,
    'order_queues_display',
  )
})

onUnmounted(() => {
  unsubscribeRealtime?.()
  unsubscribeRealtime = null
})
</script>

<template>
  <div class="min-h-svh w-full bg-background p-5 md:p-10">
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead class="h-14 text-lg font-semibold">{{ t('queue.displayNumber') }}</TableHead>
          <TableHead class="h-14 text-lg font-semibold">{{ t('queue.customer') }}</TableHead>
          <TableHead class="h-14 text-lg font-semibold">{{ t('common.table') }}</TableHead>
          <TableHead class="h-14 text-lg font-semibold">{{ t('queue.displayOrders') }}</TableHead>
          <TableHead class="h-14 text-lg font-semibold">{{ t('common.notes') }}</TableHead>
          <TableHead class="h-14 text-lg font-semibold">{{ t('common.status') }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="isLoading">
          <TableCell colspan="6" class="h-24 text-center text-lg text-muted-foreground">
            {{ t('queue.loading') }}
          </TableCell>
        </TableRow>
        <TableRow v-else-if="!queues.length">
          <TableCell colspan="6" class="h-24 text-center text-lg text-muted-foreground">
            {{ t('queue.noActive') }}
          </TableCell>
        </TableRow>
        <TableRow
          v-for="queue in queues"
          :key="queue.id"
          class="text-base"
        >
          <TableCell class="py-4 text-xl font-bold">
            {{ formatQueueNumber(queue.queue_number) }}
          </TableCell>
          <TableCell class="py-4 text-lg">
            {{ displayCustomerName(queue.transactions?.customers?.name) }}
          </TableCell>
          <TableCell class="py-4 text-lg">
            {{ queue.table_number ?? '-' }}
          </TableCell>
          <TableCell class="max-w-xl py-4 text-lg">
            {{ formatItems(queue) || '-' }}
          </TableCell>
          <TableCell class="max-w-md py-4 text-lg text-muted-foreground">
            <span v-if="queue.transactions?.notes" class="text-foreground">
              {{ queue.transactions.notes }}
            </span>
            <span v-else>-</span>
          </TableCell>
          <TableCell class="py-4">
            <span
              class="inline-flex rounded-md px-3 py-1 text-base font-medium"
              :class="statusClass[queue.status]"
            >
              {{ getQueueStatusLabel(queue.status) }}
            </span>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
