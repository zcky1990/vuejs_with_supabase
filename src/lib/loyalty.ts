import { getCurrentUser } from './auth'
import {
  getLoyaltyEarnPoints,
  getLoyaltyPointRedeemValue,
  getShopConfig,
  isLoyaltyEnabled,
} from './config'
import { getCustomerById, isWalkInCustomer } from './customer'
import { supabase } from './supabase'
import { useLocaleStore } from '@/stores/useLocaleStore'
import type {
  Customer,
  CustomerPointLedgerEntry,
  CustomerPointLedgerEntryType,
  ShopConfig,
} from '@/types/database'

export type LoyaltyPaymentPreview = {
  pointsRedeemed: number
  pointsEarned: number
  discountAmount: number
  finalTotal: number
  grossAmount: number
}

export function isLoyaltyEligibleCustomer(customer: Pick<Customer, 'is_member' | 'is_active' | 'name'> | null | undefined) {
  if (!customer) return false
  if (!customer.is_member || !customer.is_active) return false
  return !isWalkInCustomer(customer)
}

export function calculateRedeemDiscount(points: number, config: ShopConfig | null) {
  const redeemValue = getLoyaltyPointRedeemValue(config)
  if (points <= 0 || redeemValue <= 0) return 0
  return points * redeemValue
}

export function maxRedeemablePoints(
  balance: number,
  grossAmount: number,
  config: ShopConfig | null,
) {
  const redeemValue = getLoyaltyPointRedeemValue(config)
  if (balance <= 0 || grossAmount <= 0 || redeemValue <= 0) return 0
  const maxByTotal = Math.floor(grossAmount / redeemValue)
  return Math.max(0, Math.min(balance, maxByTotal))
}

export function buildLoyaltyPaymentPreview(
  customer: Pick<Customer, 'is_member' | 'is_active' | 'name' | 'loyalty_points'> | null | undefined,
  grossAmount: number,
  pointsToRedeem: number,
  config: ShopConfig | null,
): LoyaltyPaymentPreview | null {
  if (!isLoyaltyEnabled(config) || !isLoyaltyEligibleCustomer(customer)) {
    return null
  }

  const pointsRedeemed = Math.min(
    Math.max(0, Math.floor(pointsToRedeem)),
    maxRedeemablePoints(customer!.loyalty_points, grossAmount, config),
  )
  const discountAmount = calculateRedeemDiscount(pointsRedeemed, config)
  const finalTotal = Math.max(0, grossAmount - discountAmount)
  const pointsEarned = getLoyaltyEarnPoints(config)

  return {
    pointsRedeemed,
    pointsEarned,
    discountAmount,
    finalTotal,
    grossAmount,
  }
}

export async function getCustomerPointBalance(customerId: string) {
  const { customer, error } = await getCustomerById(customerId)
  if (error || !customer) {
    return { balance: 0, error: error ?? { message: useLocaleStore().translate('loyalty.customerNotFound') } }
  }

  return { balance: customer.loyalty_points, error: null }
}

export async function getCustomerPointLedger(customerId: string, limit = 50) {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('customer_point_ledger')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { entries: data as CustomerPointLedgerEntry[] | null, error }
}

async function insertLedgerEntry(input: {
  customerId: string
  transactionId?: string | null
  entryType: CustomerPointLedgerEntryType
  pointsDelta: number
  balanceAfter: number
  notes?: string | null
  createdBy?: string | null
}) {
  const supabaseClient = supabase()
  const { error } = await supabaseClient
    .from('customer_point_ledger')
    .insert({
      customer_id: input.customerId,
      transaction_id: input.transactionId ?? null,
      entry_type: input.entryType,
      points_delta: input.pointsDelta,
      balance_after: input.balanceAfter,
      notes: input.notes ?? null,
      created_by: input.createdBy ?? null,
    })

  return { error }
}

async function updateCustomerBalance(customerId: string, balance: number) {
  const supabaseClient = supabase()
  const { error } = await supabaseClient
    .from('customers')
    .update({ loyalty_points: balance })
    .eq('id', customerId)

  return { error }
}

export async function applyLoyaltyOnPayment(input: {
  transactionId: string
  customerId: string
  grossAmount: number
  pointsToRedeem?: number
}) {
  const { config } = await getShopConfig()
  if (!isLoyaltyEnabled(config)) {
    return { preview: null, error: null }
  }

  const { customer, error: customerError } = await getCustomerById(input.customerId)
  if (customerError || !customer) {
    return { preview: null, error: customerError }
  }

  if (!isLoyaltyEligibleCustomer(customer)) {
    return { preview: null, error: null }
  }

  const supabaseClient = supabase()
  const { data: existingTransaction, error: fetchError } = await supabaseClient
    .from('transactions')
    .select('loyalty_points_earned, loyalty_points_redeemed')
    .eq('id', input.transactionId)
    .single()

  if (fetchError) {
    return { preview: null, error: fetchError }
  }

  if ((existingTransaction?.loyalty_points_earned ?? 0) > 0) {
    return { preview: null, error: null }
  }

  const preview = buildLoyaltyPaymentPreview(
    customer,
    input.grossAmount,
    input.pointsToRedeem ?? 0,
    config,
  )

  if (!preview) {
    return { preview: null, error: null }
  }

  const { user } = await getCurrentUser()
  let balance = customer.loyalty_points

  if (preview.pointsRedeemed > 0) {
    balance -= preview.pointsRedeemed
    const { error: redeemLedgerError } = await insertLedgerEntry({
      customerId: input.customerId,
      transactionId: input.transactionId,
      entryType: 'redeem',
      pointsDelta: -preview.pointsRedeemed,
      balanceAfter: balance,
      createdBy: user?.id ?? null,
    })

    if (redeemLedgerError) {
      return { preview: null, error: redeemLedgerError }
    }
  }

  if (preview.pointsEarned > 0) {
    balance += preview.pointsEarned
    const { error: earnLedgerError } = await insertLedgerEntry({
      customerId: input.customerId,
      transactionId: input.transactionId,
      entryType: 'earn',
      pointsDelta: preview.pointsEarned,
      balanceAfter: balance,
      createdBy: user?.id ?? null,
    })

    if (earnLedgerError) {
      return { preview: null, error: earnLedgerError }
    }
  }

  const { error: balanceError } = await updateCustomerBalance(input.customerId, balance)
  if (balanceError) {
    return { preview: null, error: balanceError }
  }

  const { error: transactionError } = await supabaseClient
    .from('transactions')
    .update({
      gross_amount: preview.grossAmount,
      loyalty_discount_amount: preview.discountAmount,
      loyalty_points_redeemed: preview.pointsRedeemed,
      loyalty_points_earned: preview.pointsEarned,
      total_amount: preview.finalTotal,
    })
    .eq('id', input.transactionId)

  if (transactionError) {
    return { preview: null, error: transactionError }
  }

  return { preview, error: null }
}

export async function reverseLoyaltyForCancelledTransaction(transactionId: string) {
  const supabaseClient = supabase()
  const { data: transaction, error: fetchError } = await supabaseClient
    .from('transactions')
    .select('id, customer_id, is_paid, loyalty_points_earned, loyalty_points_redeemed')
    .eq('id', transactionId)
    .single()

  if (fetchError || !transaction) {
    return { error: fetchError }
  }

  if (!transaction.is_paid) {
    return { error: null }
  }

  const pointsEarned = Number(transaction.loyalty_points_earned ?? 0)
  const pointsRedeemed = Number(transaction.loyalty_points_redeemed ?? 0)

  if (pointsEarned <= 0 && pointsRedeemed <= 0) {
    return { error: null }
  }

  const { customer, error: customerError } = await getCustomerById(transaction.customer_id)
  if (customerError || !customer) {
    return { error: customerError }
  }

  const { user } = await getCurrentUser()
  let balance = customer.loyalty_points

  if (pointsEarned > 0) {
    balance = Math.max(0, balance - pointsEarned)
    const { error } = await insertLedgerEntry({
      customerId: transaction.customer_id,
      transactionId,
      entryType: 'reverse_earn',
      pointsDelta: -pointsEarned,
      balanceAfter: balance,
      notes: 'Transaction cancelled',
      createdBy: user?.id ?? null,
    })
    if (error) return { error }
  }

  if (pointsRedeemed > 0) {
    balance += pointsRedeemed
    const { error } = await insertLedgerEntry({
      customerId: transaction.customer_id,
      transactionId,
      entryType: 'reverse_redeem',
      pointsDelta: pointsRedeemed,
      balanceAfter: balance,
      notes: 'Transaction cancelled',
      createdBy: user?.id ?? null,
    })
    if (error) return { error }
  }

  const { error: balanceError } = await updateCustomerBalance(transaction.customer_id, balance)
  if (balanceError) {
    return { error: balanceError }
  }

  const { error: transactionError } = await supabaseClient
    .from('transactions')
    .update({
      loyalty_points_earned: 0,
      loyalty_points_redeemed: 0,
      loyalty_discount_amount: 0,
      gross_amount: null,
    })
    .eq('id', transactionId)

  return { error: transactionError }
}
