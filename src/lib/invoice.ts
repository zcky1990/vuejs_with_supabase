import {
  cartAddonsToInput,
  formatItemWithAddons,
  getLineSubtotal,
  type CartAddonSelection,
} from '@/lib/addon'
import type {
  Customer,
  PaymentMethod,
  Product,
  Transaction,
  TransactionWithDetails,
} from '@/types/database'

export type InvoiceCartItem = {
  product: Product
  quantity: number
  addons: CartAddonSelection[]
}

export type InvoiceLineItem = {
  label: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export type InvoiceData = {
  transactionId: string
  invoiceNumber: string
  shopName: string
  shopAddress: string | null
  customerName: string
  items: InvoiceLineItem[]
  totalAmount: number
  paymentMethod: PaymentMethod
  paidAt: string
  notes: string | null
  queueNumber: number | null
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  qris: 'QRIS',
  cash: 'Cash',
  transfer: 'Transfer',
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  return PAYMENT_LABELS[method]
}

export function formatInvoiceNumber(transactionId: string, paidAt: string) {
  const date = new Date(paidAt)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const shortId = transactionId.replace(/-/g, '').slice(0, 6).toLowerCase()

  return `INV-${y}${m}${d}-${shortId}`
}

export function formatInvoiceDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function buildInvoiceFromTransaction(
  transaction: TransactionWithDetails,
  paymentMethod: PaymentMethod,
  extras?: { queueNumber?: number | null, paidAt?: string },
): InvoiceData {
  const paidAt = extras?.paidAt ?? transaction.paid_at ?? new Date().toISOString()

  return {
    transactionId: transaction.id,
    invoiceNumber: formatInvoiceNumber(transaction.id, paidAt),
    shopName: '',
    shopAddress: null,
    customerName: transaction.customers?.name ?? 'Pelanggan',
    items: transaction.transaction_items.map((item) => ({
      label: formatItemWithAddons(item),
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      subtotal: getLineSubtotal(
        item.quantity,
        Number(item.unit_price),
        (item.transaction_item_addons ?? []).map((addon) => ({
          addon_product_id: addon.addon_product_id,
          quantity: addon.quantity,
          unit_price: Number(addon.unit_price),
        })),
      ),
    })),
    totalAmount: Number(transaction.total_amount),
    paymentMethod,
    paidAt,
    notes: transaction.notes,
    queueNumber: extras?.queueNumber ?? null,
  }
}

export function buildInvoiceFromCart(
  cart: InvoiceCartItem[],
  customer: Customer | null,
  transaction: Transaction,
  paymentMethod: PaymentMethod,
  extras?: { queueNumber?: number | null, paidAt?: string },
): InvoiceData {
  const paidAt = extras?.paidAt ?? transaction.paid_at ?? new Date().toISOString()

  return {
    transactionId: transaction.id,
    invoiceNumber: formatInvoiceNumber(transaction.id, paidAt),
    shopName: '',
    shopAddress: null,
    customerName: customer?.name ?? 'Pelanggan',
    items: cart.map((item) => ({
      label: item.addons.length
        ? `${item.product.name} (+ ${item.addons.map((a) => a.product.name).join(', ')})`
        : `${item.product.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`,
      quantity: item.quantity,
      unitPrice: item.product.price,
      subtotal: getLineSubtotal(item.quantity, item.product.price, cartAddonsToInput(item.addons)),
    })),
    totalAmount: Number(transaction.total_amount),
    paymentMethod,
    paidAt,
    notes: transaction.notes,
    queueNumber: extras?.queueNumber ?? null,
  }
}

export function applyShopInfoToInvoice(
  invoice: InvoiceData,
  shopName: string | null | undefined,
  shopAddress: string | null | undefined,
): InvoiceData {
  return {
    ...invoice,
    shopName: shopName?.trim() || 'INVOICE',
    shopAddress: shopAddress?.trim() || null,
  }
}
