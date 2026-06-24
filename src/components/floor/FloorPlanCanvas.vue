<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  FLOOR_CANVAS_HEIGHT,
  FLOOR_CANVAS_WIDTH,
  FLOOR_GRID_SIZE,
} from '@/lib/floor'
import { useI18n } from '@/composables/useI18n'
import type { FloorElementKind, QueueStatus, TableOccupancy, TableShape } from '@/types/database'

export type CanvasTable = {
  id: string
  label: string
  shape: TableShape
  kind: FloorElementKind
  color?: string | null
  pos_x: number
  pos_y: number
  width: number
  height: number
  seats?: number | null
}

const props = withDefaults(
  defineProps<{
    tables: CanvasTable[]
    editable?: boolean
    selectedId?: string | null
    occupancyByLabel?: Record<string, TableOccupancy>
  }>(),
  {
    editable: false,
    selectedId: null,
    occupancyByLabel: undefined,
  },
)

const emit = defineEmits<{
  'update:tables': [tables: CanvasTable[]]
  select: [id: string]
}>()

const { t } = useI18n()

const canvasRef = ref<HTMLElement | null>(null)

const statusClass: Record<QueueStatus, string> = {
  waiting: 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300',
  preparing: 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300',
  ready: 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300',
  serving: 'bg-violet-500/20 border-violet-500 text-violet-700 dark:text-violet-300',
  completed: 'bg-muted border-border text-muted-foreground',
  cancelled: 'bg-muted border-border text-muted-foreground',
}

const showOccupancy = computed(() => props.occupancyByLabel !== undefined)

function occupancyFor(table: CanvasTable): TableOccupancy | undefined {
  return props.occupancyByLabel?.[table.label.trim()]
}

function isZone(table: CanvasTable) {
  return table.kind === 'zone'
}

function tableClass(table: CanvasTable) {
  const classes: string[] = ['border-2']

  if (table.shape === 'round') {
    classes.push('rounded-full')
  } else {
    classes.push('rounded-lg')
  }

  if (isZone(table)) {
    classes.push('text-foreground')
  } else if (showOccupancy.value) {
    const occupancy = occupancyFor(table)
    classes.push(
      occupancy
        ? statusClass[occupancy.status]
        : 'bg-background border-border text-foreground',
    )
  } else {
    classes.push('bg-primary/10 border-primary/60 text-foreground')
  }

  if (props.editable) {
    classes.push('cursor-move select-none')
    if (props.selectedId === table.id) {
      classes.push('ring-2 ring-primary ring-offset-2 ring-offset-background')
    }
  }

  return classes
}

function withAlpha(color: string, alphaHex: string) {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}${alphaHex}` : color
}

function elementStyle(table: CanvasTable) {
  const style: Record<string, string> = {
    left: `${table.pos_x}px`,
    top: `${table.pos_y}px`,
    width: `${table.width}px`,
    height: `${table.height}px`,
    touchAction: props.editable ? 'none' : 'auto',
    zIndex: isZone(table) ? '0' : '1',
  }

  if (isZone(table) && table.color) {
    style.backgroundColor = withAlpha(table.color, '33')
    style.borderColor = table.color
  }

  return style
}

type DragState = {
  id: string
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
}

let dragState: DragState | null = null

function snap(value: number) {
  return Math.round(value / FLOOR_GRID_SIZE) * FLOOR_GRID_SIZE
}

function clamp(value: number, max: number) {
  return Math.max(0, Math.min(value, max))
}

function onPointerDown(event: PointerEvent, table: CanvasTable) {
  emit('select', table.id)

  if (!props.editable) return

  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)

  dragState = {
    id: table.id,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: table.pos_x,
    originY: table.pos_y,
  }
}

function onPointerMove(event: PointerEvent) {
  if (!dragState || dragState.pointerId !== event.pointerId) return

  const table = props.tables.find((item) => item.id === dragState!.id)
  if (!table) return

  const deltaX = event.clientX - dragState.startX
  const deltaY = event.clientY - dragState.startY

  const nextX = clamp(snap(dragState.originX + deltaX), FLOOR_CANVAS_WIDTH - table.width)
  const nextY = clamp(snap(dragState.originY + deltaY), FLOOR_CANVAS_HEIGHT - table.height)

  if (nextX === table.pos_x && nextY === table.pos_y) return

  const updated = props.tables.map((item) =>
    item.id === table.id ? { ...item, pos_x: nextX, pos_y: nextY } : item,
  )
  emit('update:tables', updated)
}

function onPointerUp(event: PointerEvent) {
  if (dragState && dragState.pointerId === event.pointerId) {
    dragState = null
  }
}

defineExpose({ canvasRef })
</script>

<template>
  <div class="w-full overflow-auto rounded-xl border bg-muted/20 p-3">
    <div
      ref="canvasRef"
      class="relative mx-auto bg-background"
      :style="{
        width: `${FLOOR_CANVAS_WIDTH}px`,
        height: `${FLOOR_CANVAS_HEIGHT}px`,
        backgroundImage:
          'linear-gradient(to right, color-mix(in srgb, currentColor 6%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, currentColor 6%, transparent) 1px, transparent 1px)',
        backgroundSize: `${FLOOR_GRID_SIZE * 2}px ${FLOOR_GRID_SIZE * 2}px`,
      }"
    >
      <div
        v-if="!tables.length"
        class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
      >
        {{ t('floor.emptyCanvas') }}
      </div>

      <div
        v-for="table in tables"
        :key="table.id"
        class="absolute flex flex-col items-center justify-center px-1 text-center transition-shadow"
        :class="tableClass(table)"
        :style="elementStyle(table)"
        @pointerdown="onPointerDown($event, table)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <span class="text-sm font-bold leading-tight">{{ table.label }}</span>
        <template v-if="table.kind === 'table'">
          <span v-if="table.seats" class="text-[10px] leading-tight opacity-80">
            {{ t('floor.seatsShort', { count: table.seats }) }}
          </span>
          <span
            v-if="showOccupancy && occupancyFor(table)"
            class="text-[10px] font-medium leading-tight"
          >
            #{{ occupancyFor(table)!.queueNumber }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
