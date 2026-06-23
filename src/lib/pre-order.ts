import { supabase } from './supabase'
import {
  getLineSubtotal,
  expandItemsForSubmit,
  PRE_ORDER_ITEMS_WITH_ADDONS_SELECT,
} from './addon'
import { createQueueEntry } from './queue'
import { createTransaction, getWalkInCustomer } from './transaction'
import { preOrderSubmitSchema } from '@/schema/schema'
import type {
  PaymentMethod,
  PreOrder,
  PreOrderInput,
  PreOrderPaymentStatus,
  PreOrderWithDetails,
  ProcessPreOrderOptions,
  Product,
} from '@/types/database'
import type { z } from 'zod'

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10)
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

async function getProductsStockMap(productIds: string[]) {
  if (!productIds.length) return { stockById: new Map<string, Product>(), error: null }

  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .in('id', productIds)

  if (error) {
    return { stockById: new Map<string, Product>(), error }
  }

  return {
    stockById: new Map((data as Product[] ?? []).map((product) => [product.id, product])),
    error: null,
  }
}

function validateStock(
  items: z.infer<typeof preOrderSubmitSchema>['items'],
  stockById: Map<string, Product>,
) {
  for (const item of items) {
    const product = stockById.get(item.product_id)
    if (!product || !product.is_active) {
      return { ok: false, message: 'Produk tidak tersedia' }
    }

    if (item.quantity > product.stock_quantity) {
      return { ok: false, message: `Stok ${product.name} tidak mencukupi` }
    }

    for (const addon of item.addons ?? []) {
      const addonProduct = stockById.get(addon.addon_product_id)
      const required = addon.quantity * item.quantity
      if (!addonProduct || !addonProduct.is_active || required > addonProduct.stock_quantity) {
        return { ok: false, message: 'Stok addon tidak mencukupi' }
      }
    }
  }

  return { ok: true, message: null }
}

function buildPaymentStatus(paymentChoice: PreOrderInput['payment_choice']): PreOrderPaymentStatus {
  return paymentChoice === 'pay_now' ? 'awaiting_confirmation' : 'unpaid'
}

function buildOrderNotes(preOrder: PreOrder) {
  const parts: string[] = []
  if (preOrder.customer_name) {
    parts.push(`Pelanggan: ${preOrder.customer_name}`)
  }
  if (preOrder.table_number) {
    parts.push(`Meja: ${preOrder.table_number}`)
  }
  if (preOrder.notes) {
    parts.push(preOrder.notes)
  }
  parts.push(`Pre-order #${String(preOrder.order_number).padStart(3, '0')}`)
  return parts.join(' · ') || null
}

export const createPreOrder = async (input: PreOrderInput) => {
  const validated = preOrderSubmitSchema.safeParse(input)
  if (!validated.success) {
    return { preOrder: null, error: validated.error.flatten().fieldErrors }
  }

  const payload = validated.data
  const items = expandItemsForSubmit(payload.items)
  const productIds = [
    ...items.map((item) => item.product_id),
    ...items.flatMap((item) => (item.addons ?? []).map((addon) => addon.addon_product_id)),
  ]

  const { stockById, error: stockError } = await getProductsStockMap([...new Set(productIds)])
  if (stockError) {
    return { preOrder: null, error: stockError }
  }

  const stockCheck = validateStock(items, stockById)
  if (!stockCheck.ok) {
    return { preOrder: null, error: { message: stockCheck.message! } }
  }

  const orderDate = getTodayDateString()
  const { orderNumber, error: numberError } = await getNextPreOrderNumber(orderDate)
  if (numberError || orderNumber === null) {
    return { preOrder: null, error: numberError }
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + getLineSubtotal(item.quantity, item.unit_price, item.addons),
    0,
  )

  const supabaseClient = supabase()
  const { data: preOrder, error: insertError } = await supabaseClient
    .from('pre_orders')
    .insert({
      order_number: orderNumber,
      order_date: orderDate,
      customer_name: payload.customer_name?.trim() || null,
      table_number: payload.table_number?.trim() || null,
      notes: payload.notes?.trim() || null,
      payment_choice: payload.payment_choice,
      payment_status: buildPaymentStatus(payload.payment_choice),
      total_amount: totalAmount,
      status: 'pending',
    })
    .select()
    .single()

  if (insertError || !preOrder) {
    return { preOrder: null, error: insertError }
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
      return { preOrder: null, error: itemError }
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
        return { preOrder: null, error: addonError }
      }
    }
  }

  return { preOrder: preOrder as PreOrder, error: null }
}

export const getPendingPreOrders = async () => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('pre_orders')
    .select(`
      *,
      pre_order_items (
        ${PRE_ORDER_ITEMS_WITH_ADDONS_SELECT}
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return { preOrders: data as PreOrderWithDetails[] | null, error }
}

export const cancelPreOrder = async (preOrderId: string) => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('pre_orders')
    .update({ status: 'cancelled' })
    .eq('id', preOrderId)
    .eq('status', 'pending')
    .select()
    .single()

  return { preOrder: data as PreOrder | null, error }
}

export const processPreOrder = async (preOrderId: string, options: ProcessPreOrderOptions) => {
  const supabaseClient = supabase()

  const { data: preOrder, error: fetchError } = await supabaseClient
    .from('pre_orders')
    .select(`
      *,
      pre_order_items (
        ${PRE_ORDER_ITEMS_WITH_ADDONS_SELECT}
      )
    `)
    .eq('id', preOrderId)
    .single()

  if (fetchError || !preOrder) {
    return { preOrder: null, transaction: null, queueNumber: null, error: fetchError ?? { message: 'Pesanan tidak ditemukan' } }
  }

  if (preOrder.status !== 'pending') {
    return { preOrder: null, transaction: null, queueNumber: null, error: { message: 'Pesanan sudah diproses atau dibatalkan' } }
  }

  const { error: lockError } = await supabaseClient
    .from('pre_orders')
    .update({ status: 'processing' })
    .eq('id', preOrderId)
    .eq('status', 'pending')

  if (lockError) {
    return { preOrder: null, transaction: null, queueNumber: null, error: lockError }
  }

  const items = (preOrder as PreOrderWithDetails).pre_order_items.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: Number(item.unit_price),
    addons: (item.pre_order_item_addons ?? []).map((addon) => ({
      addon_product_id: addon.addon_product_id,
      quantity: addon.quantity,
      unit_price: Number(addon.unit_price),
    })),
  }))

  const productIds = [
    ...items.map((item) => item.product_id),
    ...items.flatMap((item) => (item.addons ?? []).map((addon) => addon.addon_product_id)),
  ]
  const { stockById, error: stockError } = await getProductsStockMap([...new Set(productIds)])

  if (stockError) {
    await supabaseClient.from('pre_orders').update({ status: 'pending' }).eq('id', preOrderId)
    return { preOrder: null, transaction: null, queueNumber: null, error: stockError }
  }

  const stockCheck = validateStock(items, stockById)
  if (!stockCheck.ok) {
    await supabaseClient.from('pre_orders').update({ status: 'pending' }).eq('id', preOrderId)
    return { preOrder: null, transaction: null, queueNumber: null, error: { message: stockCheck.message! } }
  }

  const walkInCustomer = await getWalkInCustomer()
  if (!walkInCustomer) {
    await supabaseClient.from('pre_orders').update({ status: 'pending' }).eq('id', preOrderId)
    return { preOrder: null, transaction: null, queueNumber: null, error: { message: 'Pelanggan walk-in tidak ditemukan' } }
  }

  const { transaction, error: transactionError } = await createTransaction(
    {
      customer_id: walkInCustomer.id,
      notes: buildOrderNotes(preOrder as PreOrder),
      items,
    },
    { paymentMethod: options.paymentMethod },
  )

  if (transactionError || !transaction) {
    await supabaseClient.from('pre_orders').update({ status: 'pending' }).eq('id', preOrderId)
    return { preOrder: null, transaction: null, queueNumber: null, error: transactionError }
  }

  if (options.addToQueue) {
    const { queue, error: queueError } = await createQueueEntry(transaction.id, {
      tableNumber: options.tableNumber ?? preOrder.table_number,
    })

    if (queueError) {
      await supabaseClient.from('pre_orders').update({ status: 'pending' }).eq('id', preOrderId)
      return {
        preOrder: null,
        transaction: null,
        queueNumber: null,
        error: { message: `Transaksi dibuat, tetapi antrian gagal: ${queueError.message}` },
      }
    }

    const paymentStatus: PreOrderPaymentStatus =
      preOrder.payment_choice === 'pay_now' ? 'confirmed' : 'confirmed'

    const { data: completedOrder, error: completeError } = await supabaseClient
      .from('pre_orders')
      .update({
        status: 'completed',
        transaction_id: transaction.id,
        payment_status: paymentStatus,
      })
      .eq('id', preOrderId)
      .select()
      .single()

    if (completeError) {
      return { preOrder: null, transaction, queueNumber: queue?.queue_number ?? null, error: completeError }
    }

    return {
      preOrder: completedOrder as PreOrder,
      transaction,
      queueNumber: queue?.queue_number ?? null,
      error: null,
    }
  }

  const paymentStatus: PreOrderPaymentStatus =
    preOrder.payment_choice === 'pay_now' ? 'confirmed' : 'confirmed'

  const { data: completedOrder, error: completeError } = await supabaseClient
    .from('pre_orders')
    .update({
      status: 'completed',
      transaction_id: transaction.id,
      payment_status: paymentStatus,
    })
    .eq('id', preOrderId)
    .select()
    .single()

  if (completeError) {
    return { preOrder: null, transaction, queueNumber: null, error: completeError }
  }

  return {
    preOrder: completedOrder as PreOrder,
    transaction,
    queueNumber: null,
    error: null,
  }
}

type PreOrderRealtimeStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'

export const subscribePendingPreOrders = (
  onChange: () => void,
  onStatusChange?: (status: PreOrderRealtimeStatus) => void,
  channelName = 'pre_orders_pending',
) => {
  const supabaseClient = supabase()
  const channel = supabaseClient
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pre_orders',
      },
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

export function formatPreOrderNumber(number: number) {
  return `#${String(number).padStart(3, '0')}`
}

export function getPreOrderPaymentLabel(preOrder: PreOrder) {
  if (preOrder.payment_choice === 'pay_later') {
    return 'Bayar di kasir'
  }

  if (preOrder.payment_status === 'awaiting_confirmation') {
    return 'Menunggu konfirmasi bayar'
  }

  return 'Bayar sekarang'
}

export type { PaymentMethod }
