import { useLocaleStore } from '@/stores/useLocaleStore'
import type { PaymentBreakdownRow, PaymentMethod, Transaction } from '@/types/database'

const PAYMENT_LABEL_KEYS: Record<PaymentMethod, string> = {
  cash: 'payment.cash',
  qris: 'payment.qris',
  transfer: 'payment.transfer',
}

export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'qris', 'transfer']

export function paymentMethodLabel(method: PaymentMethod) {
  return useLocaleStore().translate(PAYMENT_LABEL_KEYS[method])
}

type PaymentAmountRow = Pick<Transaction, 'payment_method' | 'total_amount'>

export function sumPaymentByMethod(transactions: PaymentAmountRow[]) {
  let cashSales = 0
  let qrisSales = 0
  let transferSales = 0

  for (const row of transactions) {
    if (!row.payment_method) continue

    const amount = Number(row.total_amount)
    if (row.payment_method === 'cash') cashSales += amount
    else if (row.payment_method === 'qris') qrisSales += amount
    else if (row.payment_method === 'transfer') transferSales += amount
  }

  return {
    cashSales,
    qrisSales,
    transferSales,
    totalSales: cashSales + qrisSales + transferSales,
  }
}

export function buildPaymentBreakdown(transactions: PaymentAmountRow[]): PaymentBreakdownRow[] {
  const byMethod = new Map<PaymentMethod, PaymentBreakdownRow>()

  for (const row of transactions) {
    if (!row.payment_method) continue

    const method = row.payment_method
    const existing = byMethod.get(method) ?? {
      method,
      label: paymentMethodLabel(method),
      transactionCount: 0,
      amount: 0,
    }

    existing.transactionCount += 1
    existing.amount += Number(row.total_amount)
    byMethod.set(method, existing)
  }

  return PAYMENT_METHODS
    .map((method) => byMethod.get(method))
    .filter((row): row is PaymentBreakdownRow => row !== undefined)
}

export function mergePaymentBreakdownWithZeros(rows: PaymentBreakdownRow[]): PaymentBreakdownRow[] {
  const byMethod = new Map(rows.map((row) => [row.method, row]))

  return PAYMENT_METHODS.map((method) => byMethod.get(method) ?? {
    method,
    label: paymentMethodLabel(method),
    transactionCount: 0,
    amount: 0,
  })
}

export function buildPaymentBreakdownWithZeros(transactions: PaymentAmountRow[]): PaymentBreakdownRow[] {
  const byMethod = new Map(PAYMENT_METHODS.map((method) => [
    method,
    {
      method,
      label: paymentMethodLabel(method),
      transactionCount: 0,
      amount: 0,
    } satisfies PaymentBreakdownRow,
  ]))

  for (const row of transactions) {
    if (!row.payment_method) continue

    const existing = byMethod.get(row.payment_method)
    if (!existing) continue

    existing.transactionCount += 1
    existing.amount += Number(row.total_amount)
  }

  return PAYMENT_METHODS.map((method) => byMethod.get(method)!)
}
