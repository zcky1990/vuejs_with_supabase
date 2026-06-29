import { getShopDateString } from './date'
import { supabase } from './supabase'
import { cancelTransactionSchema, transactionItemsUpdateSchema, transactionSchema } from '@/schema/schema'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { getCurrentUser } from './auth'
import {
  expandItemsForSubmit,
  getAddonSignature,
  getLineSubtotal,
  TRANSACTION_ITEMS_WITH_ADDONS_SELECT,
} from './addon'
import { createCustomer, getCustomers } from './customer'
import { applyStockDelta, recordSaleStock, recordStockReturn, restoreTransactionStock } from './stock'
import { cancelQueueByTransactionId } from './queue'
import { canEatFirst, canPayFirst, getShopConfig, requiresTableForEatFirst } from './config'
import { resolveOpenShiftIdForCurrentUser } from './shift'
import { applyLoyaltyOnPayment, reverseLoyaltyForCancelledTransaction } from './loyalty'
import type {
  Customer,
  CreateTransactionOptions,
  MarkTransactionAsPaidOptions,
  PaymentMethod,
  Transaction,
  TransactionEventWithPerformer,
  TransactionInput,
  TransactionItemInput,
  TransactionItemWithProduct,
  TransactionStatus,
  TransactionWithDetails,
  OpenTableTransaction,
} from '@/types/database'
import { WALK_IN_CUSTOMER_NAME } from '@/types/database'
import type { z } from 'zod'

type CreateTransactionResult = {
  transaction: Transaction | null
  merged: boolean
  error: unknown
}

export const ACTIVE_TRANSACTION_STATUS: TransactionStatus = 'active'

export function isActiveTransaction(transaction: Pick<Transaction, 'status'> | { status?: TransactionStatus }) {
  return (transaction.status ?? ACTIVE_TRANSACTION_STATUS) === ACTIVE_TRANSACTION_STATUS
}

async function insertTransactionEvent(
  transactionId: string,
  eventType: 'cancelled',
  options: {
    performedBy?: string | null
    reason?: string | null
    metadata?: Record<string, unknown> | null
  },
) {
  const supabaseClient = supabase()
  const { error } = await supabaseClient
    .from('transaction_events')
    .insert({
      transaction_id: transactionId,
      event_type: eventType,
      performed_by: options.performedBy ?? null,
      reason: options.reason ?? null,
      metadata: options.metadata ?? null,
    })

  return { error }
}

function buildLineKey(productId: string, addons: { addon_product_id: string, quantity: number }[] = []) {
  return `${productId}::${getAddonSignature(addons)}`
}

function buildLineKeyFromInput(item: TransactionItemInput) {
  return buildLineKey(item.product_id, item.addons ?? [])
}

function buildLineKeyFromDbItem(item: TransactionItemWithProduct) {
  const addons = (item.transaction_item_addons ?? []).map((addon) => ({
    addon_product_id: addon.addon_product_id,
    quantity: addon.quantity,
  }))

  return buildLineKey(item.product_id, addons)
}

function itemHasAddons(
  item: { addons?: TransactionItemInput['addons'] } | TransactionItemWithProduct,
) {
  if ('addons' in item && item.addons?.length) {
    return true
  }

  const dbItem = item as TransactionItemWithProduct
  return (dbItem.transaction_item_addons?.length ?? 0) > 0
}

function canMergeTransactionItems(
  newItem: TransactionItemInput,
  existingItem?: TransactionItemWithProduct,
) {
  if (itemHasAddons(newItem)) return false
  if (existingItem && itemHasAddons(existingItem)) return false
  return !!existingItem
}

async function insertTransactionItemAddons(
  transactionItemId: string,
  menuQuantity: number,
  addons: TransactionItemInput['addons'] = [],
) {
  if (!addons?.length) return { error: null }

  const supabaseClient = supabase()
  const rows = addons.map((addon) => ({
    transaction_item_id: transactionItemId,
    addon_product_id: addon.addon_product_id,
    quantity: addon.quantity,
    unit_price: addon.unit_price,
    subtotal: addon.quantity * addon.unit_price * menuQuantity,
  }))

  const { error } = await supabaseClient.from('transaction_item_addons').insert(rows)
  return { error }
}

async function updateTransactionItemAddonSubtotals(
  transactionItemId: string,
  menuQuantity: number,
) {
  const supabaseClient = supabase()
  const { data: addons, error } = await supabaseClient
    .from('transaction_item_addons')
    .select('id, quantity, unit_price')
    .eq('transaction_item_id', transactionItemId)

  if (error || !addons) {
    return { error }
  }

  for (const addon of addons) {
    const { error: updateError } = await supabaseClient
      .from('transaction_item_addons')
      .update({
        subtotal: addon.quantity * Number(addon.unit_price) * menuQuantity,
      })
      .eq('id', addon.id)

    if (updateError) {
      return { error: updateError }
    }
  }

  return { error: null }
}

async function getTransactionTotalAmount(transactionId: string) {
  const supabaseClient = supabase()
  const { data: items, error: itemsError } = await supabaseClient
    .from('transaction_items')
    .select('id, subtotal')
    .eq('transaction_id', transactionId)

  if (itemsError || !items) {
    return { totalAmount: null, error: itemsError }
  }

  const itemIds = items.map((item) => item.id)
  let addonSubtotal = 0

  if (itemIds.length) {
    const { data: addons, error: addonsError } = await supabaseClient
      .from('transaction_item_addons')
      .select('subtotal')
      .in('transaction_item_id', itemIds)

    if (addonsError) {
      return { totalAmount: null, error: addonsError }
    }

    addonSubtotal = (addons ?? []).reduce((sum, addon) => sum + Number(addon.subtotal), 0)
  }

  const menuSubtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0)
  return { totalAmount: menuSubtotal + addonSubtotal, error: null }
}

import { getShopDayUtcRange } from './date'
import { addExpandedTableNumbers } from './table'

async function findPendingTransactionToday(customerId: string, tableNumber?: string | null) {
  const { start, end } = getShopDayUtcRange()
  const supabaseClient = supabase()
  const walkInCustomer = await getWalkInCustomer()
  const isWalkIn = walkInCustomer?.id === customerId
  const normalizedTable = tableNumber?.trim() || null

  if (isWalkIn && !normalizedTable) {
    return { transaction: null, error: null }
  }

  let query = supabaseClient
    .from('transactions')
    .select(`
      *,
      transaction_items (
        ${TRANSACTION_ITEMS_WITH_ADDONS_SELECT}
      )
    `)
    .eq('customer_id', customerId)
    .eq('is_paid', false)
    .eq('status', ACTIVE_TRANSACTION_STATUS)
    .gte('created_at', start)
    .lte('created_at', end)

  if (isWalkIn && normalizedTable) {
    query = query.eq('table_number', normalizedTable)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return { transaction: data, error }
}

async function mergeIntoTransaction(
  transactionId: string,
  existingItems: TransactionItemWithProduct[],
  newItems: TransactionInput['items'],
  notes?: string | null,
): Promise<CreateTransactionResult> {
  const supabaseClient = supabase()
  const itemsByLineKey = new Map(
    existingItems.map((item) => [buildLineKeyFromDbItem(item), item]),
  )

  for (const newItem of newItems) {
    const lineKey = buildLineKeyFromInput(newItem)
    const existingItem = itemsByLineKey.get(lineKey)

    if (existingItem && canMergeTransactionItems(newItem, existingItem)) {
      const quantity = existingItem.quantity + newItem.quantity
      const subtotal = quantity * newItem.unit_price

      const { error } = await supabaseClient
        .from('transaction_items')
        .update({
          quantity,
          unit_price: newItem.unit_price,
          subtotal,
        })
        .eq('id', existingItem.id)

      if (error) {
        return { transaction: null, merged: true, error }
      }

      const { error: addonUpdateError } = await updateTransactionItemAddonSubtotals(
        existingItem.id,
        quantity,
      )

      if (addonUpdateError) {
        return { transaction: null, merged: true, error: addonUpdateError }
      }
    } else {
      const { data: insertedItem, error: insertError } = await supabaseClient
        .from('transaction_items')
        .insert({
          transaction_id: transactionId,
          product_id: newItem.product_id,
          quantity: newItem.quantity,
          unit_price: newItem.unit_price,
          subtotal: newItem.quantity * newItem.unit_price,
        })
        .select()
        .single()

      if (insertError || !insertedItem) {
        return { transaction: null, merged: true, error: insertError }
      }

      const { error: addonError } = await insertTransactionItemAddons(
        insertedItem.id,
        newItem.quantity,
        newItem.addons,
      )

      if (addonError) {
        return { transaction: null, merged: true, error: addonError }
      }
    }
  }

  const { totalAmount, error: totalError } = await getTransactionTotalAmount(transactionId)

  if (totalError || totalAmount === null) {
    return { transaction: null, merged: true, error: totalError }
  }

  const updatePayload: { total_amount: number, gross_amount: number, notes?: string } = {
    total_amount: totalAmount,
    gross_amount: totalAmount,
  }
  if (notes) {
    updatePayload.notes = notes
  }

  const { data: transaction, error: updateError } = await supabaseClient
    .from('transactions')
    .update(updatePayload)
    .eq('id', transactionId)
    .select()
    .single()

  if (updateError || !transaction) {
    return { transaction: null, merged: true, error: updateError }
  }

  const { error: stockError } = await recordSaleStock(newItems, transactionId)
  if (stockError) {
    return { transaction: null, merged: true, error: stockError }
  }

  return {
    transaction: transaction as Transaction,
    merged: true,
    error: null,
  }
}

export async function getWalkInCustomer(): Promise<Customer | null> {
  const { customers, error } = await getCustomers()
  if (error) return null

  const existing = customers?.find((customer) => customer.name === WALK_IN_CUSTOMER_NAME)
  if (existing) return existing

  const { customer } = await createCustomer({
    name: WALK_IN_CUSTOMER_NAME,
    email: null,
    phone: null,
    address: null,
    notes: 'Default customer for unknown buyers',
    is_active: true,
  })

  return customer
}

export async function getCustomersForTransaction() {
  const walkInCustomer = await getWalkInCustomer()
  const { customers, error } = await getCustomers()

  if (error) {
    return { customers: walkInCustomer ? [walkInCustomer] : [], error }
  }

  const activeCustomers = (customers ?? []).filter((customer) => customer.is_active)
  const withoutWalkIn = activeCustomers.filter((customer) => customer.name !== WALK_IN_CUSTOMER_NAME)
  const orderedCustomers = walkInCustomer
    ? [walkInCustomer, ...withoutWalkIn]
    : withoutWalkIn

  return { customers: orderedCustomers, error: null }
}

export async function getPendingTransactionForCustomer(
  customerId: string,
  tableNumber?: string | null,
) {
  const { transaction, error } = await findPendingTransactionToday(customerId, tableNumber)
  return { transaction, error }
}

export const getTransactions = async () => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('transactions')
    .select(`
      *,
      customers ( id, name ),
      transaction_items (
        ${TRANSACTION_ITEMS_WITH_ADDONS_SELECT}
      )
    `)
    .order('created_at', { ascending: false })

  return { transactions: data as TransactionWithDetails[] | null, error }
}

export const getTransactionById = async (transactionId: string) => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('transactions')
    .select(`
      *,
      customers ( id, name ),
      transaction_items (
        ${TRANSACTION_ITEMS_WITH_ADDONS_SELECT}
      )
    `)
    .eq('id', transactionId)
    .single()

  return { transaction: data as TransactionWithDetails | null, error }
}

export const getCustomerTransactionSummary = async (customerId: string, customerName: string) => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('transactions')
    .select(`
      *,
      customers ( id, name ),
      transaction_items (
        ${TRANSACTION_ITEMS_WITH_ADDONS_SELECT}
      )
    `)
    .eq('customer_id', customerId)
    .eq('is_paid', false)
    .eq('status', ACTIVE_TRANSACTION_STATUS)
    .order('created_at', { ascending: false })

  if (error) {
    return { summary: null, error }
  }

  const transactions = (data ?? []) as TransactionWithDetails[]
  const outstandingAmount = transactions.reduce(
    (sum, transaction) => sum + Number(transaction.total_amount),
    0,
  )

  return {
    summary: {
      customerId,
      customerName,
      transactionCount: transactions.length,
      totalAmount: outstandingAmount,
      outstandingAmount,
      unpaidCount: transactions.length,
      transactions,
    },
    error: null,
  }
}

export const getCustomersWithDebt = async (customerIds: string[]) => {
  if (!customerIds.length) {
    return {
      debtByCustomerId: {} as Record<string, { outstandingAmount: number, unpaidCount: number }>,
      error: null,
    }
  }

  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('customer_id, total_amount')
    .in('customer_id', customerIds)
    .eq('is_paid', false)
    .eq('status', ACTIVE_TRANSACTION_STATUS)

  if (error) {
    return {
      debtByCustomerId: {} as Record<string, { outstandingAmount: number, unpaidCount: number }>,
      error,
    }
  }

  const debtByCustomerId: Record<string, { outstandingAmount: number, unpaidCount: number }> = {}

  for (const row of data ?? []) {
    const existing = debtByCustomerId[row.customer_id] ?? { outstandingAmount: 0, unpaidCount: 0 }
    existing.outstandingAmount += Number(row.total_amount)
    existing.unpaidCount += 1
    debtByCustomerId[row.customer_id] = existing
  }

  return { debtByCustomerId, error: null }
}

export const markTransactionAsPaid = async (
  transactionId: string,
  paymentMethod: PaymentMethod,
  options?: MarkTransactionAsPaidOptions,
) => {
  const supabaseClient = supabase()
  const { data: existing, error: fetchError } = await supabaseClient
    .from('transactions')
    .select('status, customer_id, total_amount, gross_amount')
    .eq('id', transactionId)
    .single()

  if (fetchError || !existing) {
    return { transaction: null, error: fetchError ?? { message: useLocaleStore().translate('order.transactionNotFound') } }
  }

  if (!isActiveTransaction(existing as Pick<Transaction, 'status'>)) {
    return { transaction: null, error: { message: useLocaleStore().translate('error.transactionAlreadyCancelled') } }
  }

  const grossAmount = Number(existing.gross_amount ?? existing.total_amount)
  const { error: loyaltyError } = await applyLoyaltyOnPayment({
    transactionId,
    customerId: existing.customer_id,
    grossAmount,
    pointsToRedeem: options?.loyaltyPointsRedeemed ?? 0,
  })

  if (loyaltyError) {
    return { transaction: null, error: loyaltyError }
  }

  const shiftId = await resolveOpenShiftIdForCurrentUser()
  const { data, error } = await supabaseClient
    .from('transactions')
    .update({
      is_paid: true,
      payment_method: paymentMethod,
      paid_at: new Date().toISOString(),
      ...(shiftId ? { shift_id: shiftId } : {}),
    })
    .eq('id', transactionId)
    .select()
    .single()

  if (!error && data) {
    await supabaseClient
      .from('table_bookings')
      .update({ status: 'completed' })
      .eq('transaction_id', transactionId)
      .eq('status', 'checked_in')
  }

  return { transaction: data as Transaction | null, error }
}

export const getTransactionEvents = async (transactionId: string) => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('transaction_events')
    .select(`
      *,
      profiles:performed_by ( full_name, email )
    `)
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: false })

  return { events: data as TransactionEventWithPerformer[] | null, error }
}

export const cancelTransaction = async (
  transactionId: string,
  input: { reason: string },
) => {
  const validated = cancelTransactionSchema().safeParse(input)
  if (!validated.success) {
    return { transaction: null, error: validated.error.flatten().fieldErrors }
  }

  const { user, error: userError } = await getCurrentUser()
  if (userError || !user) {
    return {
      transaction: null,
      error: userError ?? { message: useLocaleStore().translate('shift.userRequired') },
    }
  }

  const supabaseClient = supabase()
  const { data: transactionRow, error: fetchError } = await supabaseClient
    .from('transactions')
    .select(`
      id,
      status,
      is_paid,
      payment_method,
      total_amount,
      loyalty_points_earned,
      loyalty_points_redeemed,
      transaction_items (
        id,
        product_id,
        quantity,
        transaction_item_addons (
          addon_product_id,
          quantity
        )
      )
    `)
    .eq('id', transactionId)
    .single()

  if (fetchError || !transactionRow) {
    return {
      transaction: null,
      error: fetchError ?? { message: useLocaleStore().translate('order.transactionNotFound') },
    }
  }

  if (!isActiveTransaction(transactionRow as Pick<Transaction, 'status'>)) {
    return { transaction: null, error: { message: useLocaleStore().translate('error.transactionAlreadyCancelled') } }
  }

  const reason = validated.data.reason.trim()
  const items = (transactionRow.transaction_items ?? []) as {
    product_id: string
    quantity: number
    transaction_item_addons?: { addon_product_id: string, quantity: number }[]
  }[]

  const { error: stockError } = await restoreTransactionStock(items, transactionId)
  if (stockError) {
    return { transaction: null, error: stockError }
  }

  const { error: queueError } = await cancelQueueByTransactionId(transactionId)
  if (queueError) {
    return { transaction: null, error: queueError }
  }

  const cancelledAt = new Date().toISOString()
  const { data: transaction, error: updateError } = await supabaseClient
    .from('transactions')
    .update({
      status: 'cancelled',
      cancelled_at: cancelledAt,
      cancelled_by: user.id,
      cancellation_reason: reason,
    })
    .eq('id', transactionId)
    .eq('status', ACTIVE_TRANSACTION_STATUS)
    .select()
    .single()

  if (updateError || !transaction) {
    return { transaction: null, error: updateError }
  }

  if (transactionRow.is_paid) {
    const { error: loyaltyReverseError } = await reverseLoyaltyForCancelledTransaction(transactionId)
    if (loyaltyReverseError) {
      return { transaction: transaction as Transaction, error: loyaltyReverseError }
    }
  }

  const { error: eventError } = await insertTransactionEvent(transactionId, 'cancelled', {
    performedBy: user.id,
    reason,
    metadata: {
      was_paid: transactionRow.is_paid,
      payment_method: transactionRow.payment_method,
      total_amount: Number(transactionRow.total_amount),
      stock_items_restored: items.length,
    },
  })

  if (eventError) {
    return { transaction: transaction as Transaction, error: eventError }
  }

  return { transaction: transaction as Transaction, error: null }
}

export const updateTransactionNotes = async (transactionId: string, notes: string | null) => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('transactions')
    .update({ notes })
    .eq('id', transactionId)
    .select()
    .single()

  return { transaction: data as Transaction | null, error }
}

export const updateTransactionItems = async (
  transactionId: string,
  input: {
    notes?: string | null
    items: {
      id?: string
      product_id: string
      quantity: number
      unit_price?: number
      addons?: TransactionItemInput['addons']
    }[]
  },
) => {
  const validated = transactionItemsUpdateSchema().safeParse(input)
  if (!validated.success) {
    return { transaction: null, error: validated.error.flatten().fieldErrors }
  }

  const supabaseClient = supabase()
  const { data: transactionRow, error: transactionError } = await supabaseClient
    .from('transactions')
    .select('is_paid, status')
    .eq('id', transactionId)
    .single()

  if (transactionError || !transactionRow) {
    return { transaction: null, error: transactionError ?? { message: useLocaleStore().translate('order.transactionNotFound') } }
  }

  if (!isActiveTransaction(transactionRow as Pick<Transaction, 'status'>)) {
    return { transaction: null, error: { message: useLocaleStore().translate('error.transactionAlreadyCancelled') } }
  }

  if (transactionRow.is_paid) {
    return { transaction: null, error: { message: useLocaleStore().translate('error.transactionAlreadyPaid') } }
  }

  const { data: currentItems, error: currentItemsError } = await supabaseClient
    .from('transaction_items')
    .select(`
      id,
      product_id,
      quantity,
      unit_price,
      transaction_item_addons (
        addon_product_id,
        quantity
      )
    `)
    .eq('transaction_id', transactionId)

  if (currentItemsError || !currentItems) {
    return { transaction: null, error: currentItemsError }
  }

  const currentById = new Map(currentItems.map((item) => [item.id, item]))
  const updatedIds = new Set(
    validated.data.items.flatMap((item) => (item.id ? [item.id] : [])),
  )
  const existingUpdates = validated.data.items.filter((item) => item.id)
  const newItems = expandItemsForSubmit(
    validated.data.items
      .filter((item) => !item.id)
      .map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price ?? 0,
        addons: item.addons,
      })),
  )

  for (const currentItem of currentItems) {
    if (updatedIds.has(currentItem.id)) continue

    const { error: stockError } = await recordStockReturn(currentItem.product_id, currentItem.quantity, {
      referenceId: transactionId,
      notes: 'Pengembalian dari hapus item transaksi',
    })

    if (stockError) {
      return { transaction: null, error: stockError }
    }

    for (const addon of currentItem.transaction_item_addons ?? []) {
      const { error: addonStockError } = await recordStockReturn(
        addon.addon_product_id,
        currentItem.quantity * addon.quantity,
        {
          referenceId: transactionId,
          notes: 'Pengembalian addon dari hapus item transaksi',
        },
      )

      if (addonStockError) {
        return { transaction: null, error: addonStockError }
      }
    }

    const { error } = await supabaseClient
      .from('transaction_items')
      .delete()
      .eq('id', currentItem.id)

    if (error) {
      return { transaction: null, error }
    }
  }

  for (const item of existingUpdates) {
    const currentItem = currentById.get(item.id!)
    if (!currentItem) {
      return { transaction: null, error: { message: useLocaleStore().translate('error.transactionItemNotFound') } }
    }

    const quantityDelta = item.quantity - currentItem.quantity

    if (quantityDelta !== 0) {
      const { error: stockError } = await applyStockDelta(item.product_id, quantityDelta, transactionId)
      if (stockError) {
        return { transaction: null, error: stockError }
      }

      for (const addon of currentItem.transaction_item_addons ?? []) {
        const { error: addonStockError } = await applyStockDelta(
          addon.addon_product_id,
          quantityDelta * addon.quantity,
          transactionId,
        )

        if (addonStockError) {
          return { transaction: null, error: addonStockError }
        }
      }
    }

    const subtotal = item.quantity * Number(currentItem.unit_price)
    const { error } = await supabaseClient
      .from('transaction_items')
      .update({ quantity: item.quantity, subtotal })
      .eq('id', item.id)

    if (error) {
      return { transaction: null, error }
    }

    const { error: addonUpdateError } = await updateTransactionItemAddonSubtotals(item.id!, item.quantity)
    if (addonUpdateError) {
      return { transaction: null, error: addonUpdateError }
    }
  }

  if (newItems.length) {
    const { data: remainingItems, error: remainingError } = await supabaseClient
      .from('transaction_items')
      .select(`
        id,
        product_id,
        quantity,
        unit_price,
        transaction_item_addons (
          addon_product_id,
          quantity
        )
      `)
      .eq('transaction_id', transactionId)

    if (remainingError || !remainingItems) {
      return { transaction: null, error: remainingError }
    }

    const itemsByLineKey = new Map(
      remainingItems.map((item) => [buildLineKeyFromDbItem(item as TransactionItemWithProduct), item]),
    )

    for (const newItem of newItems) {
      const unitPrice = newItem.unit_price!
      const lineKey = buildLineKeyFromInput({
        product_id: newItem.product_id,
        quantity: newItem.quantity,
        unit_price: unitPrice,
        addons: newItem.addons,
      })
      const existingItem = itemsByLineKey.get(lineKey)

      if (existingItem && canMergeTransactionItems(
        { product_id: newItem.product_id, quantity: newItem.quantity, unit_price: unitPrice, addons: newItem.addons },
        existingItem as TransactionItemWithProduct,
      )) {
        const quantity = existingItem.quantity + newItem.quantity
        const subtotal = quantity * unitPrice

        const { error: stockError } = await applyStockDelta(newItem.product_id, newItem.quantity, transactionId)
        if (stockError) {
          return { transaction: null, error: stockError }
        }

        for (const addon of existingItem.transaction_item_addons ?? []) {
          const { error: addonStockError } = await applyStockDelta(
            addon.addon_product_id,
            newItem.quantity * addon.quantity,
            transactionId,
          )

          if (addonStockError) {
            return { transaction: null, error: addonStockError }
          }
        }

        const { error } = await supabaseClient
          .from('transaction_items')
          .update({ quantity, subtotal })
          .eq('id', existingItem.id)

        if (error) {
          return { transaction: null, error }
        }

        const { error: addonUpdateError } = await updateTransactionItemAddonSubtotals(existingItem.id, quantity)
        if (addonUpdateError) {
          return { transaction: null, error: addonUpdateError }
        }

        itemsByLineKey.set(lineKey, { ...existingItem, quantity })
        continue
      }

      const { data: insertedItem, error: insertError } = await supabaseClient
        .from('transaction_items')
        .insert({
          transaction_id: transactionId,
          product_id: newItem.product_id,
          quantity: newItem.quantity,
          unit_price: unitPrice,
          subtotal: newItem.quantity * unitPrice,
        })
        .select()
        .single()

      if (insertError || !insertedItem) {
        return { transaction: null, error: insertError }
      }

      const { error: addonError } = await insertTransactionItemAddons(
        insertedItem.id,
        newItem.quantity,
        newItem.addons,
      )

      if (addonError) {
        return { transaction: null, error: addonError }
      }

      const { error: stockError } = await recordSaleStock(
        [{
          product_id: newItem.product_id,
          quantity: newItem.quantity,
          addons: newItem.addons?.map((addon) => ({
            addon_product_id: addon.addon_product_id,
            quantity: addon.quantity,
          })),
        }],
        transactionId,
      )

      if (stockError) {
        return { transaction: null, error: stockError }
      }

      itemsByLineKey.set(lineKey, insertedItem)
    }
  }

  const { totalAmount, error: totalError } = await getTransactionTotalAmount(transactionId)

  if (totalError || totalAmount === null) {
    return { transaction: null, error: totalError ?? { message: useLocaleStore().translate('error.transactionMinOneItem') } }
  }

  const { data: transaction, error: updateError } = await supabaseClient
    .from('transactions')
    .update({
      total_amount: totalAmount,
      notes: validated.data.notes ?? null,
    })
    .eq('id', transactionId)
    .select()
    .single()

  return { transaction: transaction as Transaction | null, error: updateError }
}

export const createTransaction = async (
  input: TransactionInput,
  options?: CreateTransactionOptions,
): Promise<CreateTransactionResult> => {
  const validated = transactionSchema().safeParse(input)
  if (!validated.success) {
    return { transaction: null, merged: false, error: validated.error.flatten().fieldErrors }
  }

  const payload = validated.data as z.infer<ReturnType<typeof transactionSchema>>
  const items = expandItemsForSubmit(payload.items)
  const payImmediately = !!options?.paymentMethod
  const tableNumber = payload.table_number?.trim() || options?.table_number?.trim() || null

  const { config: shopConfig } = await getShopConfig()
  const flowMode = options?.paymentFlowMode ?? shopConfig?.payment_flow_mode ?? 'both'
  const requireTable = options?.requireTableForEatFirst ?? requiresTableForEatFirst(shopConfig)

  if (payImmediately && !canPayFirst({ ...shopConfig, payment_flow_mode: flowMode } as typeof shopConfig)) {
    return {
      transaction: null,
      merged: false,
      error: { message: useLocaleStore().translate('transaction.payFirstNotAllowed') },
    }
  }

  if (!payImmediately && !canEatFirst({ ...shopConfig, payment_flow_mode: flowMode } as typeof shopConfig)) {
    return {
      transaction: null,
      merged: false,
      error: { message: useLocaleStore().translate('transaction.eatFirstNotAllowed') },
    }
  }

  if (!payImmediately) {
    const walkInCustomer = await getWalkInCustomer()
    const isWalkIn = walkInCustomer && payload.customer_id === walkInCustomer.id

    if (isWalkIn) {
      if (requireTable && !tableNumber) {
        return {
          transaction: null,
          merged: false,
          error: { message: useLocaleStore().translate('transaction.tableRequired') },
        }
      }
    }

    const { transaction: pendingTransaction, error: pendingError } = await findPendingTransactionToday(
      payload.customer_id,
      tableNumber,
    )

    if (pendingError) {
      return { transaction: null, merged: false, error: pendingError }
    }

    if (pendingTransaction) {
      return mergeIntoTransaction(
        pendingTransaction.id,
        (pendingTransaction.transaction_items ?? []) as TransactionItemWithProduct[],
        items,
        payload.notes,
      )
    }
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + getLineSubtotal(item.quantity, item.unit_price, item.addons),
    0,
  )

  const supabaseClient = supabase()
  const shiftId = payImmediately ? await resolveOpenShiftIdForCurrentUser() : null

  const { data: transaction, error: transactionError } = await supabaseClient
    .from('transactions')
    .insert({
      customer_id: payload.customer_id,
      gross_amount: totalAmount,
      total_amount: totalAmount,
      is_paid: payImmediately,
      payment_method: payImmediately ? options!.paymentMethod! : null,
      paid_at: payImmediately ? new Date().toISOString() : null,
      notes: payload.notes ?? null,
      table_number: tableNumber,
      ...(shiftId ? { shift_id: shiftId } : {}),
    })
    .select()
    .single()

  if (transactionError || !transaction) {
    return { transaction: null, merged: false, error: transactionError }
  }

  for (const item of items) {
    const { data: insertedItem, error: insertError } = await supabaseClient
      .from('transaction_items')
      .insert({
        transaction_id: transaction.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price,
      })
      .select()
      .single()

    if (insertError || !insertedItem) {
      await supabaseClient.from('transactions').delete().eq('id', transaction.id)
      return { transaction: null, merged: false, error: insertError }
    }

    const { error: addonError } = await insertTransactionItemAddons(
      insertedItem.id,
      item.quantity,
      item.addons,
    )

    if (addonError) {
      await supabaseClient.from('transaction_items').delete().eq('transaction_id', transaction.id)
      await supabaseClient.from('transactions').delete().eq('id', transaction.id)
      return { transaction: null, merged: false, error: addonError }
    }
  }

  const { error: stockError } = await recordSaleStock(items, transaction.id)
  if (stockError) {
    await supabaseClient.from('transaction_items').delete().eq('transaction_id', transaction.id)
    await supabaseClient.from('transactions').delete().eq('id', transaction.id)
    return { transaction: null, merged: false, error: stockError }
  }

  if (payImmediately) {
    const { error: loyaltyError } = await applyLoyaltyOnPayment({
      transactionId: transaction.id,
      customerId: payload.customer_id,
      grossAmount: totalAmount,
      pointsToRedeem: options?.loyaltyPointsRedeemed ?? 0,
    })

    if (loyaltyError) {
      await supabaseClient.from('transaction_items').delete().eq('transaction_id', transaction.id)
      await supabaseClient.from('transactions').delete().eq('id', transaction.id)
      return { transaction: null, merged: false, error: loyaltyError }
    }

    const { data: paidTransaction, error: reloadError } = await supabaseClient
      .from('transactions')
      .select()
      .eq('id', transaction.id)
      .single()

    if (reloadError || !paidTransaction) {
      return { transaction: transaction as Transaction, merged: false, error: reloadError }
    }

    return {
      transaction: paidTransaction as Transaction,
      merged: false,
      error: null,
    }
  }

  return {
    transaction: transaction as Transaction,
    merged: false,
    error: null,
  }
}

export const getOpenTableTransactions = async () => {
  const { start, end } = getShopDayUtcRange()
  const supabaseClient = supabase()

  const { data, error } = await supabaseClient
    .from('transactions')
    .select(`
      *,
      customers ( id, name ),
      order_queues (
        id,
        queue_number,
        status,
        table_number,
        created_at
      )
    `)
    .eq('is_paid', false)
    .eq('status', ACTIVE_TRANSACTION_STATUS)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  return { transactions: data as OpenTableTransaction[] | null, error }
}

export const getOccupiedTableNumbers = async () => {
  const { start, end } = getShopDayUtcRange()
  const supabaseClient = supabase()

  const [transactionsResult, queuesResult] = await Promise.all([
    supabaseClient
      .from('transactions')
      .select('table_number')
      .eq('is_paid', false)
      .eq('status', ACTIVE_TRANSACTION_STATUS)
      .gte('created_at', start)
      .lte('created_at', end)
      .not('table_number', 'is', null),
    supabaseClient
      .from('order_queues')
      .select('table_number')
      .eq('queue_date', getShopDateString())
      .in('status', ['waiting', 'preparing', 'ready', 'serving'])
      .not('table_number', 'is', null),
  ])

  const error = transactionsResult.error ?? queuesResult.error
  if (error) {
    return { occupiedTableNumbers: new Set<string>(), error }
  }

  const occupiedTableNumbers = new Set<string>()

  for (const row of transactionsResult.data ?? []) {
    addExpandedTableNumbers(occupiedTableNumbers, row.table_number)
  }

  for (const row of queuesResult.data ?? []) {
    addExpandedTableNumbers(occupiedTableNumbers, row.table_number)
  }

  return { occupiedTableNumbers, error: null }
}
