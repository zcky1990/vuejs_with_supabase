import { supabase } from './supabase'
import { TRANSACTION_ITEMS_WITH_ADDONS_SELECT } from './addon'
import { getShopDateString } from './date'
import type { OrderQueue, OrderQueueWithDetails, QueueStatus } from '@/types/database'

async function getNextQueueNumber(queueDate: string) {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('order_queues')
    .select('queue_number')
    .eq('queue_date', queueDate)
    .order('queue_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { queueNumber: null, error }
  }

  return { queueNumber: (data?.queue_number ?? 0) + 1, error: null }
}

export const createQueueEntry = async (
  transactionId: string,
  options?: { tableNumber?: string | null },
) => {
  const queueDate = getShopDateString()
  const { queueNumber, error: numberError } = await getNextQueueNumber(queueDate)

  if (numberError || queueNumber === null) {
    return { queue: null, error: numberError }
  }

  const tableNumber = options?.tableNumber?.trim() || null

  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('order_queues')
    .insert({
      transaction_id: transactionId,
      queue_number: queueNumber,
      queue_date: queueDate,
      status: 'waiting',
      table_number: tableNumber,
    })
    .select()
    .single()

  return { queue: data as OrderQueue | null, error }
}

export const getActiveQueues = async () => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('order_queues')
    .select(`
      *,
      transactions (
        *,
        customers ( id, name ),
        transaction_items (
          id,
          product_id,
          quantity,
          unit_price,
          subtotal,
          products ( id, name ),
          transaction_item_addons (
            id,
            addon_product_id,
            quantity,
            unit_price,
            subtotal,
            products ( id, name )
          )
        )
      )
    `)
    .eq('queue_date', getShopDateString())
    .in('status', ['waiting', 'preparing', 'ready', 'serving'])
    .order('queue_number', { ascending: true })

  return { queues: data as OrderQueueWithDetails[] | null, error }
}

export const updateQueueStatus = async (queueId: string, status: QueueStatus) => {
  const now = new Date().toISOString()
  const payload: Partial<OrderQueue> & { status: QueueStatus } = { status }

  if (status === 'preparing') {
    payload.picked_up_at = now
  }

  if (status === 'ready') {
    payload.ready_at = now
  }

  if (status === 'serving') {
    payload.serving_at = now
  }

  if (status === 'completed') {
    payload.completed_at = now
  }

  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('order_queues')
    .update(payload)
    .eq('id', queueId)
    .select()
    .single()

  return { queue: data as OrderQueue | null, error }
}

export const pickupQueue = async (queueId: string) => updateQueueStatus(queueId, 'preparing')

export const markQueueReady = async (queueId: string) => updateQueueStatus(queueId, 'ready')

export const markQueueServing = async (queueId: string) => updateQueueStatus(queueId, 'serving')

export const completeQueue = async (queueId: string) => updateQueueStatus(queueId, 'completed')

export const cancelQueueByTransactionId = async (transactionId: string) => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('order_queues')
    .update({ status: 'cancelled' })
    .eq('transaction_id', transactionId)
    .in('status', ['waiting', 'preparing', 'ready', 'serving'])
    .select()

  return { queues: data as OrderQueue[] | null, error }
}

type QueueRealtimeStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'

export const subscribeActiveQueues = (
  onChange: () => void,
  onStatusChange?: (status: QueueRealtimeStatus) => void,
  channelName = 'order_queues_active',
) => {
  const supabaseClient = supabase()
  const channel = supabaseClient
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_queues',
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
