import { supabase } from './supabase'
import { getShopDateString } from './date'
import { getShopConfig, isTableBookingEnabled } from './config'
import { getDiningTables } from './table'
import { getOccupiedTableNumbers } from './transaction'
import { expandItemsForSubmit, getLineSubtotal } from './addon'
import { processPreOrder } from './pre-order'
import { tableBookingCreateSchema } from '@/schema/schema'
import { useLocaleStore } from '@/stores/useLocaleStore'
import type {
  CreateTableBookingInput,
  DiningTable,
  TableBooking,
  TableBookingStatus,
  TableBookingWithDetails,
} from '@/types/database'
import type { z } from 'zod'

export const ACTIVE_BOOKING_STATUSES: TableBookingStatus[] = ['pending', 'confirmed', 'checked_in']

const BOOKING_WITH_PRE_ORDER_SELECT = `
  *,
  pre_orders!pre_order_id (
    *,
    pre_order_items (
      *,
      products ( id, name ),
      pre_order_item_addons (
        *,
        products ( id, name )
      )
    )
  )
`

const BOOKING_NO_SHOW_GRACE_MINUTES = 30

function translate(key: Parameters<ReturnType<typeof useLocaleStore>['translate']>[0]) {
  return useLocaleStore().translate(key)
}

function parseBookingDate(scheduledAt: string) {
  return getShopDateString(new Date(scheduledAt))
}

function rangeMs(scheduledAt: string, durationMinutes: number) {
  const start = new Date(scheduledAt).getTime()
  return { start, end: start + durationMinutes * 60_000 }
}

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
) {
  return aStart < bEnd && bStart < aEnd
}

function isBookingActive(status: TableBookingStatus) {
  return ACTIVE_BOOKING_STATUSES.includes(status)
}

export function bookingBlocksTable(
  booking: Pick<TableBooking, 'scheduled_at' | 'duration_minutes' | 'status' | 'dining_table_id'>,
  slotStart: string,
  durationMinutes: number,
) {
  if (!isBookingActive(booking.status)) {
    return false
  }

  const slot = rangeMs(slotStart, durationMinutes)
  const existing = rangeMs(booking.scheduled_at, booking.duration_minutes)
  return rangesOverlap(slot.start, slot.end, existing.start, existing.end)
}

export const expireStaleBookings = async () => {
  const supabaseClient = supabase()
  const now = Date.now()
  const graceMs = BOOKING_NO_SHOW_GRACE_MINUTES * 60_000

  const { data, error } = await supabaseClient
    .from('table_bookings')
    .select('id, scheduled_at, duration_minutes, status')
    .in('status', ['pending', 'confirmed'])

  if (error) {
    return { error }
  }

  const expiredIds = (data ?? [])
    .filter((row) => {
      const end = rangeMs(row.scheduled_at as string, row.duration_minutes as number).end
      return end + graceMs < now
    })
    .map((row) => row.id as string)

  if (!expiredIds.length) {
    return { error: null }
  }

  const { error: updateError } = await supabaseClient
    .from('table_bookings')
    .update({ status: 'no_show' })
    .in('id', expiredIds)

  return { error: updateError }
}

export const getBookingsForDate = async (bookingDate: string) => {
  await expireStaleBookings()

  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('table_bookings')
    .select(BOOKING_WITH_PRE_ORDER_SELECT)
    .eq('booking_date', bookingDate)
    .in('status', ACTIVE_BOOKING_STATUSES)
    .order('scheduled_at', { ascending: true })

  return { bookings: data as TableBookingWithDetails[] | null, error }
}

export const getBookings = async (options?: { fromDate?: string; status?: TableBookingStatus | 'all' }) => {
  await expireStaleBookings()

  const supabaseClient = supabase()
  let query = supabaseClient
    .from('table_bookings')
    .select(BOOKING_WITH_PRE_ORDER_SELECT)
    .order('scheduled_at', { ascending: true })

  if (options?.fromDate) {
    query = query.gte('booking_date', options.fromDate)
  }

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }

  const { data, error } = await query
  return { bookings: data as TableBookingWithDetails[] | null, error }
}

async function getNextPreOrderNumber(orderDate: string) {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('pre_orders')
    .select('order_number')
    .eq('order_date', orderDate)
    .order('order_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { orderNumber: null, error }
  }

  return { orderNumber: (data?.order_number ?? 0) + 1, error: null }
}

async function validateBookingSlot(
  diningTable: DiningTable,
  scheduledAt: string,
  durationMinutes: number,
  excludeBookingId?: string,
) {
  const bookingDate = parseBookingDate(scheduledAt)
  const { bookings, error } = await fetchActiveBookingsForDate(bookingDate)

  if (error) {
    return { ok: false as const, message: error.message }
  }

  const conflict = (bookings ?? []).find((booking) =>
    booking.dining_table_id === diningTable.id
    && booking.id !== excludeBookingId
    && bookingBlocksTable(booking, scheduledAt, durationMinutes),
  )

  if (conflict) {
    return { ok: false as const, message: translate('book.tableUnavailable') }
  }

  const today = getShopDateString()
  if (bookingDate === today) {
    const { occupiedTableNumbers, error: occupiedError } = await getOccupiedTableNumbers()
    if (occupiedError) {
      return { ok: false as const, message: occupiedError.message }
    }

    if (occupiedTableNumbers.has(diningTable.table_number)) {
      const slot = rangeMs(scheduledAt, durationMinutes)
      const now = Date.now()
      if (slot.start <= now && now < slot.end) {
        return { ok: false as const, message: translate('book.tableCurrentlyInUse') }
      }
    }
  }

  if (new Date(scheduledAt).getTime() < Date.now()) {
    return { ok: false as const, message: translate('book.scheduledAtPast') }
  }

  return { ok: true as const, message: null }
}

function isTableBlockedForSlot(
  table: DiningTable,
  bookings: Pick<TableBooking, 'dining_table_id' | 'scheduled_at' | 'duration_minutes' | 'status'>[],
  scheduledAt: string,
  durationMinutes: number,
  occupiedToday: Set<string>,
  checkLiveOccupancy: boolean,
) {
  if (checkLiveOccupancy && occupiedToday.has(table.table_number)) {
    return true
  }

  return bookings.some((booking) =>
    booking.dining_table_id === table.id
    && bookingBlocksTable(booking, scheduledAt, durationMinutes),
  )
}

async function fetchActiveBookingsForDate(bookingDate: string) {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('table_bookings')
    .select('id, dining_table_id, scheduled_at, duration_minutes, status, booking_date, table_number')
    .eq('booking_date', bookingDate)
    .in('status', ACTIVE_BOOKING_STATUSES)
    .order('scheduled_at', { ascending: true })

  return { bookings: data as TableBooking[] | null, error }
}

export const getBookingSlotTables = async (scheduledAt: string, durationMinutes?: number) => {
  const { config, error: configError } = await getShopConfig()
  if (configError || !isTableBookingEnabled(config)) {
    return {
      available: [] as DiningTable[],
      booked: [] as DiningTable[],
      error: configError ?? new Error('BOOKING_DISABLED'),
    }
  }

  const duration = durationMinutes ?? config?.booking_duration_minutes ?? 120
  const bookingDate = parseBookingDate(scheduledAt)
  const { tables, error: tablesError } = await getDiningTables()
  if (tablesError) {
    return { available: null, booked: null, error: tablesError }
  }

  const { bookings, error: bookingsError } = await fetchActiveBookingsForDate(bookingDate)
  if (bookingsError) {
    return { available: null, booked: null, error: bookingsError }
  }

  let occupiedToday = new Set<string>()
  if (bookingDate === getShopDateString()) {
    const { occupiedTableNumbers, error } = await getOccupiedTableNumbers()
    if (error) {
      return { available: null, booked: null, error }
    }
    occupiedToday = occupiedTableNumbers
  }

  const slot = rangeMs(scheduledAt, duration)
  const now = Date.now()
  const checkLiveOccupancy = bookingDate === getShopDateString() && slot.start <= now && now < slot.end

  const activeTables = (tables ?? []).filter((table) => table.is_active)
  const available: DiningTable[] = []
  const booked: DiningTable[] = []

  for (const table of activeTables) {
    if (isTableBlockedForSlot(table, bookings ?? [], scheduledAt, duration, occupiedToday, checkLiveOccupancy)) {
      booked.push(table)
    } else {
      available.push(table)
    }
  }

  return { available, booked, error: null }
}

export const getAvailableTablesForSlot = async (scheduledAt: string, durationMinutes?: number) => {
  const { available, error } = await getBookingSlotTables(scheduledAt, durationMinutes)
  if (error) {
    return { tables: available, error }
  }
  return { tables: available ?? [], error: null }
}

export const getReservedTableNumbersForToday = async () => {
  const today = getShopDateString()
  const { bookings, error } = await fetchActiveBookingsForDate(today)
  if (error) {
    return { reservedByLabel: {} as Record<string, TableBooking>, error }
  }

  const reservedByLabel: Record<string, TableBooking> = {}
  for (const booking of bookings ?? []) {
    if (booking.status === 'checked_in') continue
    if (['confirmed', 'pending'].includes(booking.status)) {
      reservedByLabel[booking.table_number] = booking
    }
  }

  return { reservedByLabel, error: null }
}

export function formatBookingTableNumbers(tableNumbers: string[]) {
  return [...tableNumbers].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join(', ')
}

export const createTableBookingWithPreOrder = async (input: CreateTableBookingInput) => {
  const validated = tableBookingCreateSchema().safeParse(input)
  if (!validated.success) {
    return { bookings: null, preOrder: null, error: validated.error.flatten().fieldErrors }
  }

  const payload = validated.data
  const uniqueTableIds = [...new Set(payload.dining_table_ids)]
  const { config, error: configError } = await getShopConfig()
  if (configError || !isTableBookingEnabled(config)) {
    return { bookings: null, preOrder: null, error: { message: translate('book.disabled') } }
  }

  const durationMinutes = config?.booking_duration_minutes ?? 120
  const { tables, error: tablesError } = await getDiningTables()
  if (tablesError) {
    return { bookings: null, preOrder: null, error: tablesError }
  }

  const diningTables = uniqueTableIds
    .map((id) => (tables ?? []).find((table) => table.id === id))
    .filter((table): table is DiningTable => !!table && table.is_active)

  if (diningTables.length !== uniqueTableIds.length) {
    return { bookings: null, preOrder: null, error: { message: translate('book.tableUnavailable') } }
  }

  const totalSeats = diningTables.reduce((sum, table) => sum + table.seats, 0)
  if (payload.party_size > totalSeats) {
    return { bookings: null, preOrder: null, error: { message: translate('book.partySizeExceedsSeats') } }
  }

  for (const diningTable of diningTables) {
    const slotCheck = await validateBookingSlot(diningTable, payload.scheduled_at, durationMinutes)
    if (!slotCheck.ok) {
      return { bookings: null, preOrder: null, error: { message: slotCheck.message } }
    }
  }

  const items = expandItemsForSubmit(payload.items)
  const totalAmount = items.reduce(
    (sum, item) => sum + getLineSubtotal(item.quantity, item.unit_price, item.addons),
    0,
  )

  const bookingDate = parseBookingDate(payload.scheduled_at)
  const initialStatus: TableBookingStatus = config?.booking_auto_confirm ? 'confirmed' : 'pending'
  const supabaseClient = supabase()
  const createdBookingIds: string[] = []

  async function rollbackCreatedBookings() {
    if (!createdBookingIds.length) return
    await supabaseClient.from('table_bookings').delete().in('id', createdBookingIds)
  }

  for (const diningTable of diningTables) {
    const { data: booking, error: bookingError } = await supabaseClient
      .from('table_bookings')
      .insert({
        dining_table_id: diningTable.id,
        table_number: diningTable.table_number,
        customer_name: payload.customer_name?.trim() || null,
        customer_phone: payload.customer_phone?.trim() || null,
        party_size: payload.party_size,
        scheduled_at: payload.scheduled_at,
        booking_date: bookingDate,
        duration_minutes: durationMinutes,
        status: initialStatus,
        notes: payload.notes?.trim() || null,
      })
      .select()
      .single()

    if (bookingError || !booking) {
      await rollbackCreatedBookings()
      return { bookings: null, preOrder: null, error: bookingError }
    }

    createdBookingIds.push(booking.id)
  }

  const tableNumbersLabel = formatBookingTableNumbers(diningTables.map((table) => table.table_number))
  const primaryBookingId = createdBookingIds[0]

  const { orderNumber, error: numberError } = await getNextPreOrderNumber(bookingDate)
  if (numberError || orderNumber === null) {
    await rollbackCreatedBookings()
    return { bookings: null, preOrder: null, error: numberError }
  }

  const { data: preOrder, error: preOrderError } = await supabaseClient
    .from('pre_orders')
    .insert({
      order_number: orderNumber,
      order_date: bookingDate,
      customer_name: payload.customer_name?.trim() || null,
      table_number: tableNumbersLabel,
      notes: payload.notes?.trim() || null,
      payment_choice: 'pay_later',
      payment_status: 'unpaid',
      total_amount: totalAmount,
      status: 'pending',
      booking_id: primaryBookingId,
    })
    .select()
    .single()

  if (preOrderError || !preOrder) {
    await rollbackCreatedBookings()
    return { bookings: null, preOrder: null, error: preOrderError }
  }

  for (const item of items) {
    const subtotal = item.quantity * item.unit_price
    const { data: insertedItem, error: itemError } = await supabaseClient
      .from('pre_order_items')
      .insert({
        pre_order_id: preOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal,
      })
      .select()
      .single()

    if (itemError || !insertedItem) {
      await supabaseClient.from('pre_orders').delete().eq('id', preOrder.id)
      await rollbackCreatedBookings()
      return { bookings: null, preOrder: null, error: itemError }
    }

    if (item.addons?.length) {
      const addonRows = item.addons.map((addon) => ({
        pre_order_item_id: insertedItem.id,
        addon_product_id: addon.addon_product_id,
        quantity: addon.quantity,
        unit_price: addon.unit_price,
        subtotal: addon.quantity * addon.unit_price * item.quantity,
      }))

      const { error: addonError } = await supabaseClient
        .from('pre_order_item_addons')
        .insert(addonRows)

      if (addonError) {
        await supabaseClient.from('pre_orders').delete().eq('id', preOrder.id)
        await rollbackCreatedBookings()
        return { bookings: null, preOrder: null, error: addonError }
      }
    }
  }

  const { data: linkedBookings, error: linkError } = await supabaseClient
    .from('table_bookings')
    .update({ pre_order_id: preOrder.id })
    .in('id', createdBookingIds)
    .select()

  if (linkError) {
    return { bookings: linkedBookings as TableBooking[] | null, preOrder, error: linkError }
  }

  return {
    bookings: linkedBookings as TableBooking[],
    preOrder,
    error: null,
  }
}

export const confirmBooking = async (bookingId: string) => {
  const supabaseClient = supabase()

  const { data: booking, error: fetchError } = await supabaseClient
    .from('table_bookings')
    .select('id, pre_order_id, status')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) {
    return { bookings: null, error: fetchError ?? { message: translate('book.notFound') } }
  }

  let query = supabaseClient
    .from('table_bookings')
    .update({ status: 'confirmed' })
    .eq('status', 'pending')

  if (booking.pre_order_id) {
    query = query.eq('pre_order_id', booking.pre_order_id)
  } else {
    query = query.eq('id', bookingId)
  }

  const { data, error } = await query.select()
  return { bookings: data as TableBooking[] | null, error }
}

export const cancelBooking = async (bookingId: string) => {
  const supabaseClient = supabase()

  const { data: booking, error: fetchError } = await supabaseClient
    .from('table_bookings')
    .select('id, pre_order_id, status')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) {
    return { bookings: null, error: fetchError ?? { message: translate('book.notFound') } }
  }

  if (['completed', 'cancelled', 'no_show', 'expired'].includes(booking.status as string)) {
    return { bookings: null, error: { message: translate('book.cannotCancel') } }
  }

  let cancelQuery = supabaseClient
    .from('table_bookings')
    .update({ status: 'cancelled' })

  if (booking.pre_order_id) {
    cancelQuery = cancelQuery.eq('pre_order_id', booking.pre_order_id)
  } else {
    cancelQuery = cancelQuery.eq('id', bookingId)
  }

  const { data, error } = await cancelQuery.select()

  if (error) {
    return { bookings: null, error }
  }

  if (booking.pre_order_id) {
    await supabaseClient
      .from('pre_orders')
      .update({ status: 'cancelled' })
      .eq('id', booking.pre_order_id)
      .eq('status', 'pending')
  }

  return { bookings: data as TableBooking[], error: null }
}

export const checkInBooking = async (bookingId: string) => {
  const supabaseClient = supabase()

  const { data: booking, error: fetchError } = await supabaseClient
    .from('table_bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) {
    return { bookings: null, transaction: null, queueNumber: null, error: fetchError ?? { message: translate('book.notFound') } }
  }

  if (!['pending', 'confirmed'].includes(booking.status as string)) {
    return { bookings: null, transaction: null, queueNumber: null, error: { message: translate('book.cannotCheckIn') } }
  }

  if (!booking.pre_order_id) {
    return { bookings: null, transaction: null, queueNumber: null, error: { message: translate('book.noPreOrder') } }
  }

  const { data: groupBookings, error: groupError } = await supabaseClient
    .from('table_bookings')
    .select('id, table_number, status')
    .eq('pre_order_id', booking.pre_order_id)
    .in('status', ['pending', 'confirmed'])

  if (groupError) {
    return { bookings: null, transaction: null, queueNumber: null, error: groupError }
  }

  const activeGroup = groupBookings ?? []
  if (!activeGroup.length) {
    return { bookings: null, transaction: null, queueNumber: null, error: { message: translate('book.cannotCheckIn') } }
  }

  const tableNumbers = formatBookingTableNumbers(activeGroup.map((row) => row.table_number as string))

  const { transaction, queueNumber, error: processError } = await processPreOrder(
    booking.pre_order_id,
    {
      addToQueue: true,
      tableNumber: tableNumbers,
    },
  )

  if (processError || !transaction) {
    return { bookings: null, transaction: null, queueNumber: null, error: processError }
  }

  const { data: updatedBookings, error: updateError } = await supabaseClient
    .from('table_bookings')
    .update({
      status: 'checked_in',
      transaction_id: transaction.id,
    })
    .eq('pre_order_id', booking.pre_order_id)
    .in('id', activeGroup.map((row) => row.id as string))
    .select()

  return {
    bookings: updatedBookings as TableBooking[] | null,
    transaction,
    queueNumber,
    error: updateError,
  }
}

export function formatBookingReference(booking: Pick<TableBooking, 'id' | 'table_number' | 'scheduled_at'>) {
  const date = new Date(booking.scheduled_at)
  const stamp = Number.isNaN(date.getTime())
    ? booking.scheduled_at
    : date.toISOString().slice(0, 16).replace('T', ' ')
  return `${booking.table_number} · ${stamp}`
}

type BookingRealtimeStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'

export const subscribeTableBookings = (
  onChange: () => void,
  onStatusChange?: (status: BookingRealtimeStatus) => void,
  channelName = 'table_bookings_changes',
) => {
  const supabaseClient = supabase()
  const channel = supabaseClient
    .channel(channelName)
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
