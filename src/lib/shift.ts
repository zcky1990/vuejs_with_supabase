import { getShopDateString } from './date'
import { supabase } from './supabase'
import { getCurrentUser } from './auth'
import { buildPaymentBreakdown, sumPaymentByMethod } from './payment-breakdown'
import { useLocaleStore } from '@/stores/useLocaleStore'
import type {
  CashierShift,
  ShiftLiveTotals,
  Transaction,
} from '@/types/database'

async function getShiftPaidTransactions(shiftId: string) {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('payment_method, total_amount')
    .eq('shift_id', shiftId)
    .eq('is_paid', true)
    .eq('status', 'active')

  return { transactions: (data ?? []) as Pick<Transaction, 'payment_method' | 'total_amount'>[], error }
}

export async function getOpenShiftForCurrentUser() {
  const { user, error: userError } = await getCurrentUser()
  if (userError || !user) {
    return { shift: null, error: userError ?? { message: useLocaleStore().translate('shift.userRequired') } }
  }

  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('cashier_shifts')
    .select('*')
    .eq('cashier_id', user.id)
    .eq('status', 'open')
    .maybeSingle()

  return { shift: data as CashierShift | null, error }
}

export async function resolveOpenShiftIdForCurrentUser() {
  const { shift } = await getOpenShiftForCurrentUser()
  return shift?.id ?? null
}

export async function openShift(openingBalance: number) {
  if (!Number.isFinite(openingBalance) || openingBalance < 0) {
    return { shift: null, error: { message: useLocaleStore().translate('shift.invalidOpeningBalance') } }
  }

  const { user, error: userError } = await getCurrentUser()
  if (userError || !user) {
    return { shift: null, error: userError ?? { message: useLocaleStore().translate('shift.userRequired') } }
  }

  const { shift: existing } = await getOpenShiftForCurrentUser()
  if (existing) {
    return { shift: null, error: { message: useLocaleStore().translate('shift.alreadyOpen') } }
  }

  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('cashier_shifts')
    .insert({
      cashier_id: user.id,
      shift_date: getShopDateString(),
      opening_balance: openingBalance,
      status: 'open',
    })
    .select()
    .single()

  return { shift: data as CashierShift | null, error }
}

export async function getShiftLiveTotals(shift: CashierShift): Promise<{ totals: ShiftLiveTotals | null, error: unknown }> {
  const { transactions, error } = await getShiftPaidTransactions(shift.id)
  if (error) {
    return { totals: null, error }
  }

  const { cashSales, qrisSales, transferSales, totalSales } = sumPaymentByMethod(transactions)

  return {
    totals: {
      transactionCount: transactions.length,
      totalSales,
      cashSales,
      qrisSales,
      transferSales,
      expectedCashInDrawer: Number(shift.opening_balance) + cashSales,
      payments: buildPaymentBreakdown(transactions),
    },
    error: null,
  }
}

export async function closeShift(
  shiftId: string,
  closingBalanceActual: number,
  notes?: string | null,
) {
  if (!Number.isFinite(closingBalanceActual) || closingBalanceActual < 0) {
    return { shift: null, error: { message: useLocaleStore().translate('shift.invalidClosingBalance') } }
  }

  const supabaseClient = supabase()
  const { data: shift, error: fetchError } = await supabaseClient
    .from('cashier_shifts')
    .select('*')
    .eq('id', shiftId)
    .eq('status', 'open')
    .single()

  if (fetchError || !shift) {
    return { shift: null, error: fetchError ?? { message: useLocaleStore().translate('shift.notFound') } }
  }

  const { transactions, error: txError } = await getShiftPaidTransactions(shiftId)
  if (txError) {
    return { shift: null, error: txError }
  }

  const { cashSales, qrisSales, transferSales, totalSales } = sumPaymentByMethod(transactions)
  const closingBalanceExpected = Number(shift.opening_balance) + cashSales
  const cashVariance = closingBalanceActual - closingBalanceExpected

  const { data, error } = await supabaseClient
    .from('cashier_shifts')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      total_sales: totalSales,
      cash_sales: cashSales,
      qris_sales: qrisSales,
      transfer_sales: transferSales,
      transaction_count: transactions.length,
      closing_balance_expected: closingBalanceExpected,
      closing_balance_actual: closingBalanceActual,
      cash_variance: cashVariance,
      notes: notes?.trim() || null,
    })
    .eq('id', shiftId)
    .eq('status', 'open')
    .select()
    .single()

  return { shift: data as CashierShift | null, error }
}

export async function getShiftsForDate(shiftDate = getShopDateString()) {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('cashier_shifts')
    .select('*')
    .eq('shift_date', shiftDate)
    .order('opened_at', { ascending: false })

  return { shifts: (data ?? []) as CashierShift[], error }
}

export async function getDayShiftSummary(shiftDate = getShopDateString()) {
  const { shifts, error } = await getShiftsForDate(shiftDate)
  if (error) {
    return { shifts: [], totals: null, error }
  }

  const closed = shifts.filter((shift) => shift.status === 'closed')
  const totals = {
    shiftCount: shifts.length,
    closedCount: closed.length,
    totalSales: closed.reduce((sum, shift) => sum + Number(shift.total_sales ?? 0), 0),
    cashSales: closed.reduce((sum, shift) => sum + Number(shift.cash_sales ?? 0), 0),
    qrisSales: closed.reduce((sum, shift) => sum + Number(shift.qris_sales ?? 0), 0),
    transferSales: closed.reduce((sum, shift) => sum + Number(shift.transfer_sales ?? 0), 0),
    cashVariance: closed.reduce((sum, shift) => sum + Number(shift.cash_variance ?? 0), 0),
    transactionCount: closed.reduce((sum, shift) => sum + Number(shift.transaction_count ?? 0), 0),
  }

  return { shifts, totals, error: null }
}
