import { supabase } from './supabase'
import type {
  AnalyticsDateRange,
  AnalyticsSummary,
  DateRangePreset,
  PaymentBreakdownRow,
  PaymentMethod,
  ProductAnalyticsRow,
  TransactionWithDetails,
} from '@/types/database'

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  qris: 'QRIS',
  cash: 'Tunai',
  transfer: 'Transfer',
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export function getDateRangePreset(
  preset: DateRangePreset,
  customStart?: Date,
  customEnd?: Date,
): AnalyticsDateRange {
  const now = new Date()

  if (preset === 'custom' && customStart && customEnd) {
    return {
      start: startOfDay(customStart).toISOString(),
      end: endOfDay(customEnd).toISOString(),
    }
  }

  if (preset === 'today') {
    return {
      start: startOfDay(now).toISOString(),
      end: endOfDay(now).toISOString(),
    }
  }

  if (preset === '7d') {
    const start = new Date(now)
    start.setDate(start.getDate() - 6)
    return {
      start: startOfDay(start).toISOString(),
      end: endOfDay(now).toISOString(),
    }
  }

  if (preset === '30d') {
    const start = new Date(now)
    start.setDate(start.getDate() - 29)
    return {
      start: startOfDay(start).toISOString(),
      end: endOfDay(now).toISOString(),
    }
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: startOfDay(monthStart).toISOString(),
    end: endOfDay(monthEnd).toISOString(),
  }
}

async function fetchTransactionsInRange(range: AnalyticsDateRange) {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('transactions')
    .select(`
      *,
      transaction_items (
        id,
        product_id,
        quantity,
        unit_price,
        subtotal,
        products ( id, name )
      )
    `)
    .gte('created_at', range.start)
    .lte('created_at', range.end)
    .order('created_at', { ascending: false })

  return {
    transactions: (data ?? []) as TransactionWithDetails[],
    error,
  }
}

async function fetchSaleMovementsForTransactions(transactionIds: string[]) {
  if (!transactionIds.length) {
    return { movements: [] as { product_id: string, reference_id: string | null, total_cost: number | null }[], error: null }
  }

  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('stock_movements')
    .select('product_id, reference_id, total_cost')
    .eq('movement_type', 'sale')
    .in('reference_id', transactionIds)

  return { movements: data ?? [], error }
}

async function fetchRestockSpend(range: AnalyticsDateRange) {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('stock_movements')
    .select('total_cost')
    .eq('movement_type', 'restock')
    .gte('created_at', range.start)
    .lte('created_at', range.end)

  const total = (data ?? []).reduce((sum, row) => sum + Number(row.total_cost ?? 0), 0)
  return { total, error }
}

async function fetchOutstandingDebt() {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('total_amount')
    .eq('is_paid', false)

  const total = (data ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0)
  return { total, error }
}

async function fetchInventoryValue() {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('stock_movements')
    .select('remaining_quantity, unit_cost')
    .eq('movement_type', 'restock')
    .gt('remaining_quantity', 0)

  const total = (data ?? []).reduce(
    (sum, row) => sum + Number(row.remaining_quantity ?? 0) * Number(row.unit_cost ?? 0),
    0,
  )

  return { total, error }
}

function computeSummary(
  transactions: TransactionWithDetails[],
  saleMovements: { product_id: string, reference_id: string | null, total_cost: number | null }[],
  restockSpend: number,
  outstandingDebt: number,
  inventoryValue: number,
): AnalyticsSummary {
  let revenue = 0
  let paidCount = 0
  let paidAmount = 0
  let unpaidCount = 0
  let unpaidAmount = 0

  const cogsByTransaction = new Map<string, number>()
  for (const movement of saleMovements) {
    if (!movement.reference_id) continue
    const current = cogsByTransaction.get(movement.reference_id) ?? 0
    cogsByTransaction.set(movement.reference_id, current + Number(movement.total_cost ?? 0))
  }

  let salesWithoutCogsCount = 0

  for (const transaction of transactions) {
    const txRevenue = (transaction.transaction_items ?? []).reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    )
    revenue += txRevenue

    const txCogs = cogsByTransaction.get(transaction.id) ?? 0
    const hasSoldItems = (transaction.transaction_items ?? []).some((item) => item.quantity > 0)
    if (hasSoldItems && txCogs === 0) {
      salesWithoutCogsCount += 1
    }

    if (transaction.is_paid) {
      paidCount += 1
      paidAmount += Number(transaction.total_amount)
    } else {
      unpaidCount += 1
      unpaidAmount += Number(transaction.total_amount)
    }
  }

  const cogs = Array.from(cogsByTransaction.values()).reduce((sum, value) => sum + value, 0)
  const grossProfit = revenue - cogs
  const marginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0

  return {
    revenue,
    cogs,
    grossProfit,
    marginPercent,
    transactionCount: transactions.length,
    paidCount,
    paidAmount,
    unpaidCount,
    unpaidAmount,
    restockSpend,
    outstandingDebt,
    inventoryValue,
    salesWithoutCogsCount,
  }
}

function computeProductAnalytics(
  transactions: TransactionWithDetails[],
  saleMovements: { product_id: string, reference_id: string | null, total_cost: number | null }[],
): ProductAnalyticsRow[] {
  const byProduct = new Map<string, ProductAnalyticsRow>()

  for (const transaction of transactions) {
    for (const item of transaction.transaction_items ?? []) {
      const productId = item.product_id
      const productName = item.products?.name ?? 'Produk tidak diketahui'
      const existing = byProduct.get(productId) ?? {
        productId,
        productName,
        quantitySold: 0,
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        marginPercent: 0,
      }

      existing.quantitySold += item.quantity
      existing.revenue += Number(item.subtotal)
      byProduct.set(productId, existing)
    }
  }

  const transactionIds = new Set(transactions.map((tx) => tx.id))

  for (const movement of saleMovements) {
    if (!movement.reference_id || !transactionIds.has(movement.reference_id)) continue

    const existing = byProduct.get(movement.product_id)
    if (!existing) continue

    existing.cogs += Number(movement.total_cost ?? 0)
    byProduct.set(movement.product_id, existing)
  }

  return Array.from(byProduct.values())
    .map((row) => {
      const grossProfit = row.revenue - row.cogs
      const marginPercent = row.revenue > 0 ? (grossProfit / row.revenue) * 100 : 0
      return { ...row, grossProfit, marginPercent }
    })
    .sort((a, b) => b.grossProfit - a.grossProfit)
}

function computePaymentBreakdown(transactions: TransactionWithDetails[]): PaymentBreakdownRow[] {
  const byMethod = new Map<PaymentMethod, PaymentBreakdownRow>()

  for (const transaction of transactions) {
    if (!transaction.is_paid || !transaction.payment_method) continue

    const method = transaction.payment_method
    const existing = byMethod.get(method) ?? {
      method,
      label: PAYMENT_LABELS[method],
      transactionCount: 0,
      amount: 0,
    }

    existing.transactionCount += 1
    existing.amount += Number(transaction.total_amount)
    byMethod.set(method, existing)
  }

  return Array.from(byMethod.values()).sort((a, b) => b.amount - a.amount)
}

export async function getAnalyticsSummary(range: AnalyticsDateRange) {
  const { transactions, error: txError } = await fetchTransactionsInRange(range)
  if (txError) return { summary: null, error: txError }

  const transactionIds = transactions.map((tx) => tx.id)
  const [
    { movements: saleMovements, error: saleError },
    { total: restockSpend, error: restockError },
    { total: outstandingDebt, error: debtError },
    { total: inventoryValue, error: inventoryError },
  ] = await Promise.all([
    fetchSaleMovementsForTransactions(transactionIds),
    fetchRestockSpend(range),
    fetchOutstandingDebt(),
    fetchInventoryValue(),
  ])

  const error = saleError ?? restockError ?? debtError ?? inventoryError
  if (error) return { summary: null, error }

  return {
    summary: computeSummary(transactions, saleMovements, restockSpend, outstandingDebt, inventoryValue),
    error: null,
  }
}

export async function getProductAnalytics(range: AnalyticsDateRange) {
  const { transactions, error: txError } = await fetchTransactionsInRange(range)
  if (txError) return { products: null, error: txError }

  const transactionIds = transactions.map((tx) => tx.id)
  const { movements: saleMovements, error: saleError } = await fetchSaleMovementsForTransactions(transactionIds)
  if (saleError) return { products: null, error: saleError }

  return {
    products: computeProductAnalytics(transactions, saleMovements),
    error: null,
  }
}

export async function getPaymentBreakdown(range: AnalyticsDateRange) {
  const { transactions, error } = await fetchTransactionsInRange(range)
  if (error) return { payments: null, error }

  return {
    payments: computePaymentBreakdown(transactions),
    error: null,
  }
}

export async function getFullAnalyticsReport(range: AnalyticsDateRange) {
  const { transactions, error: txError } = await fetchTransactionsInRange(range)
  if (txError) {
    return { summary: null, products: null, payments: null, error: txError }
  }

  const transactionIds = transactions.map((tx) => tx.id)
  const [
    { movements: saleMovements, error: saleError },
    { total: restockSpend, error: restockError },
    { total: outstandingDebt, error: debtError },
    { total: inventoryValue, error: inventoryError },
  ] = await Promise.all([
    fetchSaleMovementsForTransactions(transactionIds),
    fetchRestockSpend(range),
    fetchOutstandingDebt(),
    fetchInventoryValue(),
  ])

  const error = saleError ?? restockError ?? debtError ?? inventoryError
  if (error) {
    return { summary: null, products: null, payments: null, error }
  }

  return {
    summary: computeSummary(transactions, saleMovements, restockSpend, outstandingDebt, inventoryValue),
    products: computeProductAnalytics(transactions, saleMovements),
    payments: computePaymentBreakdown(transactions),
    error: null,
  }
}

export { PAYMENT_LABELS }
