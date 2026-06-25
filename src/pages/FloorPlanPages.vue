<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Monitor, Pencil, Printer, RefreshCw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import FloorPlanCanvas, { type CanvasTable } from '@/components/floor/FloorPlanCanvas.vue'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/composables/useI18n'
import { useRoleStore } from '@/stores/useRoleStore'
import { getFloorTables, getTableOccupancy, subscribeFloorOccupancy } from '@/lib/floor'
import { printFloorPlan } from '@/lib/print-floor'
import { useAlertStore } from '@/stores/useAlertStore'
import type { FloorTable, TableOccupancy } from '@/types/database'

const { t } = useI18n()
const roleStore = useRoleStore()
const alertStore = useAlertStore()

const floorTables = ref<FloorTable[]>([])
const canvasTables = ref<CanvasTable[]>([])
const occupancyByLabel = ref<Record<string, TableOccupancy>>({})
const isLoading = ref(true)

let unsubscribe: (() => void) | null = null

const legendItems = [
  { status: 'free', class: 'bg-background border-border' },
  { status: 'waiting', class: 'bg-amber-500/20 border-amber-500' },
  { status: 'preparing', class: 'bg-blue-500/20 border-blue-500' },
  { status: 'ready', class: 'bg-emerald-500/20 border-emerald-500' },
  { status: 'serving', class: 'bg-violet-500/20 border-violet-500' },
  { status: 'occupied', class: 'bg-rose-500/20 border-rose-500' },
  { status: 'reserved', class: 'bg-cyan-500/20 border-cyan-500' },
] as const

async function loadTables() {
  isLoading.value = true
  const { tables, error } = await getFloorTables()
  isLoading.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), error.message, 'error')
    return
  }

  floorTables.value = tables ?? []
  canvasTables.value = (tables ?? []).map((table) => ({
    id: table.id,
    label: table.label,
    shape: table.shape,
    kind: table.kind,
    color: table.color,
    pos_x: table.pos_x,
    pos_y: table.pos_y,
    width: table.width,
    height: table.height,
    seats: table.seats,
  }))
}

async function loadOccupancy() {
  const { occupancyByLabel: data, error } = await getTableOccupancy()
  if (error) return
  occupancyByLabel.value = data
}

async function refresh() {
  await Promise.all([loadTables(), loadOccupancy()])
}

function handlePrint() {
  printFloorPlan(floorTables.value, {
    title: t('floor.printTitle'),
    occupancyByLabel: occupancyByLabel.value,
  })
}

function legendLabel(status: (typeof legendItems)[number]['status']) {
  if (status === 'waiting') return t('status.waiting')
  if (status === 'preparing') return t('status.preparing')
  if (status === 'ready') return t('status.ready')
  if (status === 'serving') return t('status.serving')
  if (status === 'occupied') return t('floor.legendOccupied')
  if (status === 'reserved') return t('floor.legendReserved')
  return t('floor.legendFree')
}

onMounted(async () => {
  await refresh()
  unsubscribe = subscribeFloorOccupancy(() => {
    loadOccupancy()
  }, undefined, 'floor_plan_occupancy')
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6 p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">{{ t('floor.viewTitle') }}</h1>
          <p class="text-sm text-muted-foreground">{{ t('floor.viewSubtitle') }}</p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" :disabled="isLoading" @click="refresh">
            <RefreshCw class="size-4" :class="{ 'animate-spin': isLoading }" />
            {{ t('common.refresh') }}
          </Button>
          <Button variant="outline" :disabled="!floorTables.length" @click="handlePrint">
            <Printer class="size-4" />
            {{ t('floor.print') }}
          </Button>
          <Button variant="outline" as-child>
            <RouterLink to="/floor-plan/display" target="_blank">
              <Monitor class="size-4" />
              {{ t('floor.display') }}
            </RouterLink>
          </Button>
          <Button v-if="roleStore.isOwner" as-child>
            <RouterLink to="/floor-plan/edit">
              <Pencil class="size-4" />
              {{ t('floor.edit') }}
            </RouterLink>
          </Button>
        </div>
      </div>

      <div class="flex flex-wrap gap-4 text-sm">
        <span
          v-for="item in legendItems"
          :key="item.status"
          class="inline-flex items-center gap-2"
        >
          <span class="size-4 rounded border-2" :class="item.class" />
          {{ legendLabel(item.status) }}
        </span>
      </div>

      <p v-if="!isLoading && !floorTables.length" class="text-sm text-muted-foreground">
        {{ t('floor.noTables') }}
      </p>

      <FloorPlanCanvas
        :tables="canvasTables"
        :occupancy-by-label="occupancyByLabel"
      />
    </div>
  </DashboardLayout>
</template>
