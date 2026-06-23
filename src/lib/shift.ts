import { getShopDateString } from './date'
import { supabase } from './supabase'
import { getCurrentUser } from './auth'
import { useLocaleStore } from '@/stores/useLocaleStore'
import type {
  CashierShift,
  PaymentBreakdownRow,
  PaymentMethod,
  ShiftLiveTotals,
  Transaction,
} from '@/types/database'

const PAYMENT_LABEL_KEYS: Record<PaymentMethod, string> = {
  cash: 'payment.cash',
  qris: 'payment.qris',
  transfer: 'payment.transfer',
}

function paymentLabel(method: PaymentMethod) {
  return useLocaleStore().translate(PAYMENT_LABEL_KEYS[method])
}

function sumByMethod(transactions: Pick<Transaction, 'payment_method' | 'total_amount'>[]) {
  let cashSales = 0
  let qrisSales = 0
  let transferSales = 0

  for (const row of transactions) {
    const amount = Number(row.total_amount)
    if (row.payment_method === 'cash') cashSales += amount
    else if (row.payment_method === 'qris') qrisSales += amount
    else if (row.payment_method === 'transfer') transferSales += amount
  }

  return { cashSales, qrisSales, transferSales }
}

function buildPaymentBreakdown(transactions: Pick<Transaction, 'payment_method' | 'total_amount'>[]): PaymentBreakdownRow[] {
  const byMethod = new Map<PaymentMethod, PaymentBreakdownRow>()

  for (const row of transactions) {
    if (!row.payment_method) continue

    const method = row.payment_method
    const existing = byMethod.get(method) ?? {
      method,
      label: paymentLabel(method),
      transactionCount: 0,
      amount: 0,
    }

    existing.transactionCount += 1
    existing.amount += Number(row.total_amount)
    byMethod.set(method, existing)
  }

  return Array.from(byMethod.values()).sort((a, b) => b.amount - a.amount)
}

async function getShiftPaidTransactions(shiftId: string) {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('payment_method, total_amount')
    .eq('shift_id', shiftId)
    .eq('is_paid', true)

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

  const { cashSales, qrisSales, transferSales } = sumByMethod(transactions)
  const totalSales = cashSales + qrisSales + transferSales

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

  const { cashSales, qrisSales, transferSales } = sumByMethod(transactions)
  const totalSales = cashSales + qrisSales + transferSales
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
    cashVariance: closed.reduce((sum, shift) => sum + Number(shift.cash_variance ?? 0), 0),
    transactionCount: closed.reduce((sum, shift) => sum + Number(shift.transaction_count ?? 0), 0),
  }

  return { shifts, totals, error: null }
}
