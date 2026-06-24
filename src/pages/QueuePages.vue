<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Check, ChefHat, ClipboardList, Monitor, Radio } from '@lucide/vue'
import QueueCard from '@/components/queue/QueueCard.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getQueueStatusLabel, useActiveQueues, useQueueFilter } from '@/composables/useActiveQueues'
import { useI18n } from '@/composables/useI18n'
import { completeQueue, markQueueReady, markQueueServing, pickupQueue } from '@/lib/queue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { useAlertStore } from '@/stores/useAlertStore'

const { t } = useI18n()
const alertStore = useAlertStore()
const isUpdating = ref(false)

const { queues, isLoading, isRealtimeConnected, loadQueues } = useActiveQueues()
const {
  activeFilter,
  filterOptions,
  filteredQueues,
  waitingCount,
  preparingCount,
  readyCount,
  servingCount,
} = useQueueFilter(() => queues.value)

async function handlePickup(queueId: string) {
  isUpdating.value = true
  const { error } = await pickupQueue(queueId)
  isUpdating.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), error.message, 'error')
    return
  }

  alertStore.showAlert(t('alert.success'), t('queue.started'), 'success')
}

async function handleMarkReady(queueId: string) {
  isUpdating.value = true
  const { error } = await markQueueReady(queueId)
  isUpdating.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), error.message, 'error')
    return
  }

  alertStore.showAlert(t('alert.success'), t('queue.ready'), 'success')
}

async function handleMarkServing(queueId: string) {
  isUpdating.value = true
  const { error } = await markQueueServing(queueId)
  isUpdating.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), error.message, 'error')
    return
  }

  alertStore.showAlert(t('alert.success'), t('queue.serving'), 'success')
}

async function handleComplete(queueId: string) {
  isUpdating.value = true
  const { error } = await completeQueue(queueId)
  isUpdating.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), error.message, 'error')
    return
  }

  alertStore.showAlert(t('alert.success'), t('queue.done'), 'success')
}
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6 p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ClipboardList class="size-6" />
            {{ t('queue.title') }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ t('queue.subtitle') }}
            <span
              v-if="isRealtimeConnected"
              class="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300"
            >
              <Radio class="size-3" />
              {{ t('common.live') }}
            </span>
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button variant="outline" :disabled="isLoading" @click="loadQueues">
            {{ t('common.refresh') }}
          </Button>
          <Button variant="outline" as-child>
            <RouterLink :to="{ name: 'queue-display' }" target="_blank" rel="noopener noreferrer">
              <Monitor class="size-4" />
              {{ t('queue.display') }}
            </RouterLink>
          </Button>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent class="p-4">
            <p class="text-sm text-muted-foreground">{{ t('status.waiting') }}</p>
            <p class="text-2xl font-bold">{{ waitingCount }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <p class="text-sm text-muted-foreground">{{ t('status.preparing') }}</p>
            <p class="text-2xl font-bold">{{ preparingCount }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <p class="text-sm text-muted-foreground">{{ t('status.ready') }}</p>
            <p class="text-2xl font-bold">{{ readyCount }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <p class="text-sm text-muted-foreground">{{ t('status.serving') }}</p>
            <p class="text-2xl font-bold">{{ servingCount }}</p>
          </CardContent>
        </Card>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button
          v-for="option in filterOptions"
          :key="option.value"
          size="sm"
          :variant="activeFilter === option.value ? 'default' : 'outline'"
          @click="activeFilter = option.value"
        >
          {{ option.label }}
        </Button>
      </div>

      <div v-if="isLoading" class="text-sm text-muted-foreground">
        {{ t('queue.loading') }}
      </div>

      <div
        v-else-if="!filteredQueues.length"
        class="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground"
      >
        {{ t('queue.noActive') }}
      </div>

      <div v-else class="grid gap-3 lg:grid-cols-2">
        <QueueCard
          v-for="queue in filteredQueues"
          :key="queue.id"
          :queue="queue"
          :status-label="getQueueStatusLabel(queue.status)"
          :is-updating="isUpdating"
          @pickup="handlePickup"
          @mark-ready="handleMarkReady"
          @mark-serving="handleMarkServing"
          @complete="handleComplete"
        />
      </div>
    </div>
  </DashboardLayout>
</template>
