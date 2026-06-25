import { getReservedTableNumbersForToday } from './booking'
import { supabase } from './supabase'
import { getActiveQueues } from './queue'
import { ACTIVE_TRANSACTION_STATUS } from './transaction'
import { floorTableSchema } from '@/schema/schema'
import type { FloorTable, FloorTableInput, TableOccupancy } from '@/types/database'

export const FLOOR_CANVAS_WIDTH = 1000
export const FLOOR_CANVAS_HEIGHT = 600
export const FLOOR_GRID_SIZE = 10

function getTodayRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export const getFloorTables = async () => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('floor_tables')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  return { tables: data as FloorTable[] | null, error }
}

export const saveFloorTables = async (tables: FloorTableInput[]) => {
  for (const table of tables) {
    const validated = floorTableSchema().safeParse(table)
    if (!validated.success) {
      return { error: validated.error.flatten().fieldErrors }
    }
  }

  const supabaseClient = supabase()

  const { data: existing, error: existingError } = await supabaseClient
    .from('floor_tables')
    .select('id')

  if (existingError) {
    return { error: existingError }
  }

  const keptIds = new Set(tables.filter((table) => table.id).map((table) => table.id as string))
  const removedIds = (existing ?? [])
    .map((row) => row.id as string)
    .filter((id) => !keptIds.has(id))

  if (removedIds.length) {
    const { error: deleteError } = await supabaseClient
      .from('floor_tables')
      .delete()
      .in('id', removedIds)

    if (deleteError) {
      return { error: deleteError }
    }
  }

  const rows = tables.map((table, index) => ({
    ...(table.id ? { id: table.id } : {}),
    label: table.label.trim(),
    shape: table.shape,
    kind: table.kind,
    color: table.kind === 'zone' ? (table.color?.trim() || null) : null,
    pos_x: Math.round(table.pos_x),
    pos_y: Math.round(table.pos_y),
    width: Math.round(table.width),
    height: Math.round(table.height),
    seats: table.kind === 'table' ? (table.seats ?? null) : null,
    area: table.area?.trim() || null,
    dining_table_id: table.kind === 'table' ? (table.dining_table_id ?? null) : null,
    sort_order: index,
  }))

  if (rows.length) {
    const { error: upsertError } = await supabaseClient
      .from('floor_tables')
      .upsert(rows, { onConflict: 'id' })

    if (upsertError) {
      return { error: upsertError }
    }
  }

  return { error: null }
}

export const deleteFloorTable = async (id: string) => {
  const supabaseClient = supabase()
  const { error } = await supabaseClient.from('floor_tables').delete().eq('id', id)
  return { error }
}

async function getOpenTableNumbersToday() {
  const { start, end } = getTodayRange()
  const supabaseClient = supabase()

  const { data, error } = await supabaseClient
    .from('transactions')
    .select('table_number')
    .eq('is_paid', false)
    .eq('status', ACTIVE_TRANSACTION_STATUS)
    .gte('created_at', start)
    .lte('created_at', end)
    .not('table_number', 'is', null)

  if (error) {
    return { tableNumbers: [] as string[], error }
  }

  const tableNumbers = (data ?? [])
    .map((row) => row.table_number?.trim())
    .filter((value): value is string => Boolean(value))

  return { tableNumbers, error: null }
}

export const getTableOccupancy = async () => {
  const [
    { queues, error: queueError },
    { tableNumbers, error: txError },
    { reservedByLabel, error: reservedError },
  ] = await Promise.all([
    getActiveQueues(),
    getOpenTableNumbersToday(),
    getReservedTableNumbersForToday(),
  ])

  if (queueError || txError || reservedError) {
    return {
      occupancyByLabel: {} as Record<string, TableOccupancy>,
      error: queueError ?? txError ?? reservedError,
    }
  }

  const occupancyByLabel: Record<string, TableOccupancy> = {}

  for (const queue of queues ?? []) {
    const label = queue.table_number?.trim()
    if (!label) continue

    const existing = occupancyByLabel[label]
    if (!existing || queue.queue_number < (existing.queueNumber ?? Number.MAX_SAFE_INTEGER)) {
      occupancyByLabel[label] = {
        label,
        status: queue.status,
        queueNumber: queue.queue_number,
      }
    }
  }

  for (const tableNumber of tableNumbers) {
    if (occupancyByLabel[tableNumber]) {
      continue
    }

    occupancyByLabel[tableNumber] = {
      label: tableNumber,
      status: 'occupied',
      queueNumber: null,
    }
  }

  for (const [label] of Object.entries(reservedByLabel)) {
    if (occupancyByLabel[label]) {
      continue
    }

    occupancyByLabel[label] = {
      label,
      status: 'reserved',
      queueNumber: null,
    }
  }

  return { occupancyByLabel, error: null }
}

type RealtimeStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'

export const subscribeFloorOccupancy = (
  onChange: () => void,
  onStatusChange?: (status: RealtimeStatus) => void,
  channelName = 'floor_plan_occupancy',
) => {
  const supabaseClient = supabase()
  const channel = supabaseClient
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'order_queues' },
      () => onChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions' },
      () => onChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'table_bookings' },
      () => onChange(),
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        onStatusChange?.(status)
      }
    })

  return () => {
    supabaseClient.removeChannel(channel)
  }
}
