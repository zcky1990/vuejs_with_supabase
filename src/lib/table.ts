import { supabase } from './supabase'
import { getOccupiedTableNumbers } from './transaction'
import { getReservedTableNumbersForToday } from './booking'
import { diningTableSchema } from '@/schema/schema'
import type {
  DiningTable,
  DiningTableInput,
  DiningTableWithAvailability,
  TableAvailabilityStatus,
} from '@/types/database'
import type { z } from 'zod'

function normalizeDiningTableInput(
  input: z.infer<ReturnType<typeof diningTableSchema>>,
): DiningTableInput {
  return {
    table_number: input.table_number.trim(),
    seats: input.seats,
    is_active: input.is_active,
  }
}

function resolveAvailabilityStatus(
  table: DiningTable,
  occupiedTableNumbers: Set<string>,
  reservedTableNumbers: Set<string>,
): TableAvailabilityStatus {
  if (!table.is_active) {
    return 'inactive'
  }

  if (occupiedTableNumbers.has(table.table_number)) {
    return 'occupied'
  }

  if (reservedTableNumbers.has(table.table_number)) {
    return 'reserved'
  }

  return 'available'
}

function withAvailability(
  tables: DiningTable[],
  occupiedTableNumbers: Set<string>,
  reservedTableNumbers: Set<string>,
): DiningTableWithAvailability[] {
  return tables.map((table) => ({
    ...table,
    availability_status: resolveAvailabilityStatus(table, occupiedTableNumbers, reservedTableNumbers),
  }))
}

export const getDiningTables = async () => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('dining_tables')
    .select('*')
    .order('table_number', { ascending: true })

  return { tables: data as DiningTable[] | null, error }
}

export const getDiningTablesWithAvailability = async () => {
  const [
    { tables, error },
    { occupiedTableNumbers, error: occupiedError },
    { reservedByLabel, error: reservedError },
  ] = await Promise.all([
    getDiningTables(),
    getOccupiedTableNumbers(),
    getReservedTableNumbersForToday(),
  ])

  if (error || occupiedError || reservedError) {
    return { tables: null, error: error ?? occupiedError ?? reservedError }
  }

  const reservedTableNumbers = new Set(Object.keys(reservedByLabel))

  return {
    tables: withAvailability(tables ?? [], occupiedTableNumbers, reservedTableNumbers),
    error: null,
  }
}

export const getAvailableDiningTables = async () => {
  const { tables, error } = await getDiningTablesWithAvailability()
  if (error) {
    return { tables: null, error }
  }

  return {
    tables: (tables ?? []).filter((table) => table.availability_status === 'available'),
    error: null,
  }
}

export const getUnassignedDiningTables = async () => {
  const { tables, error } = await getDiningTables()
  if (error) {
    return { tables: null, error }
  }

  const supabaseClient = supabase()
  const { data: assignedRows, error: assignedError } = await supabaseClient
    .from('floor_tables')
    .select('dining_table_id')
    .eq('kind', 'table')
    .not('dining_table_id', 'is', null)

  if (assignedError) {
    return { tables: null, error: assignedError }
  }

  const assignedIds = new Set(
    (assignedRows ?? [])
      .map((row) => row.dining_table_id as string | null)
      .filter((id): id is string => Boolean(id)),
  )

  return {
    tables: (tables ?? []).filter((table) => !assignedIds.has(table.id)),
    error: null,
  }
}

export const isDiningTableAvailable = async (tableNumber: string) => {
  const normalized = tableNumber.trim()
  if (!normalized) {
    return { available: true, error: null }
  }

  const { tables, error } = await getDiningTablesWithAvailability()
  if (error) {
    return { available: false, error }
  }

  const table = (tables ?? []).find((item) => item.table_number === normalized)
  if (!table) {
    return { available: true, error: null }
  }

  return { available: table.availability_status === 'available', error: null }
}

export const createDiningTable = async (table: DiningTableInput) => {
  const validated = diningTableSchema().safeParse(table)
  if (!validated.success) {
    return { table: null, error: validated.error.flatten().fieldErrors }
  }

  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('dining_tables')
    .insert(normalizeDiningTableInput(validated.data))
    .select()
    .single()

  return { table: data as DiningTable | null, error }
}

export const updateDiningTable = async (id: string, table: DiningTableInput) => {
  const validated = diningTableSchema().safeParse(table)
  if (!validated.success) {
    return { table: null, error: validated.error.flatten().fieldErrors }
  }

  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('dining_tables')
    .update(normalizeDiningTableInput(validated.data))
    .eq('id', id)
    .select()
    .single()

  return { table: data as DiningTable | null, error }
}

export const deleteDiningTable = async (id: string) => {
  const supabaseClient = supabase()

  const { data: floorUsage, error: floorError } = await supabaseClient
    .from('floor_tables')
    .select('id')
    .eq('dining_table_id', id)
    .limit(1)

  if (floorError) {
    return { error: floorError }
  }

  if ((floorUsage ?? []).length > 0) {
    return { error: new Error('TABLE_IN_FLOOR_PLAN') }
  }

  const { data: diningTable, error: diningError } = await supabaseClient
    .from('dining_tables')
    .select('table_number')
    .eq('id', id)
    .maybeSingle()

  if (diningError) {
    return { error: diningError }
  }

  if (diningTable?.table_number) {
    const { occupiedTableNumbers, error: occupiedError } = await getOccupiedTableNumbers()
    if (occupiedError) {
      return { error: occupiedError }
    }

    if (occupiedTableNumbers.has(diningTable.table_number)) {
      return { error: new Error('TABLE_OCCUPIED') }
    }
  }

  const { error } = await supabaseClient.from('dining_tables').delete().eq('id', id)
  return { error }
}
