import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getActiveQueues, subscribeActiveQueues } from '@/lib/queue'
import { useAlertStore } from '@/stores/useAlertStore'
import { useLocaleStore } from '@/stores/useLocaleStore'
import type { OrderQueueWithDetails, QueueStatus } from '@/types/database'

export type QueueFilterStatus = QueueStatus | 'all'

export function getQueueStatusLabel(status: QueueStatus) {
  const localeStore = useLocaleStore()
  const keys: Record<QueueStatus, Parameters<typeof localeStore.translate>[0]> = {
    waiting: 'status.waiting',
    preparing: 'status.preparing',
    ready: 'status.ready',
    serving: 'status.serving',
    completed: 'status.completed',
    cancelled: 'status.cancelled',
  }
  return localeStore.translate(keys[status])
}

export function useActiveQueues(options?: { silentErrors?: boolean }) {
  const alertStore = useAlertStore()
  const queues = ref<OrderQueueWithDetails[]>([])
  const isLoading = ref(true)
  const isRealtimeConnected = ref(false)

  let unsubscribeRealtime: (() => void) | null = null

  async function loadQueues(loadOptions?: { silent?: boolean }) {
    if (!loadOptions?.silent) {
      isLoading.value = true
    }

    const { queues: data, error } = await getActiveQueues()
    isLoading.value = false

    if (error) {
      if (!loadOptions?.silent && !options?.silentErrors) {
        alertStore.showAlert(useLocaleStore().translate('alert.error'), error.message, 'error')
      }
      return
    }

    queues.value = data ?? []
  }

  onMounted(async () => {
    await loadQueues()

    unsubscribeRealtime = subscribeActiveQueues(
      () => loadQueues({ silent: true }),
      (status) => {
        isRealtimeConnected.value = status === 'SUBSCRIBED'
      },
    )
  })

  onUnmounted(() => {
    unsubscribeRealtime?.()
    unsubscribeRealtime = null
  })

  return {
    queues,
    isLoading,
    isRealtimeConnected,
    loadQueues,
  }
}

export function useQueueFilter(queues: () => OrderQueueWithDetails[]) {
  const localeStore = useLocaleStore()
  const activeFilter = ref<QueueFilterStatus>('all')

  const filterOptions = computed(() => [
    { value: 'all' as const, label: localeStore.translate('status.allActive') },
    { value: 'waiting' as const, label: localeStore.translate('status.waiting') },
    { value: 'preparing' as const, label: localeStore.translate('status.preparing') },
    { value: 'ready' as const, label: localeStore.translate('status.ready') },
    { value: 'serving' as const, label: localeStore.translate('status.serving') },
  ])

  const filteredQueues = computed(() => {
    if (activeFilter.value === 'all') {
      return queues()
    }

    return queues().filter((queue) => queue.status === activeFilter.value)
  })

  const waitingCount = computed(() => queues().filter((queue) => queue.status === 'waiting').length)
  const preparingCount = computed(() => queues().filter((queue) => queue.status === 'preparing').length)
  const readyCount = computed(() => queues().filter((queue) => queue.status === 'ready').length)
  const servingCount = computed(() => queues().filter((queue) => queue.status === 'serving').length)

  return {
    activeFilter,
    filterOptions,
    filteredQueues,
    waitingCount,
    preparingCount,
    readyCount,
    servingCount,
  }
}
