export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  purchase_price: number
  stock_quantity: number
  sku: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>

export type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CustomerInput = Omit<Customer, 'id' | 'created_at' | 'updated_at'>

export type CustomerWithDebt = Customer & {
  outstandingAmount: number
  unpaidCount: number
}

export const WALK_IN_CUSTOMER_NAME = 'Walk-in Customer'

export type PaymentMethod = 'qris' | 'cash' | 'transfer'

export type Transaction = {
  id: string
  customer_id: string
  total_amount: number
  is_paid: boolean
  payment_method: PaymentMethod | null
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type TransactionItem = {
  id: string
  transaction_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export type TransactionInput = {
  customer_id: string
  notes?: string | null
  items: TransactionItemInput[]
}

export type CreateTransactionOptions = {
  paymentMethod?: PaymentMethod
}

export type TransactionItemInput = {
  product_id: string
  quantity: number
  unit_price: number
}

export type TransactionProduct = {
  id: string
  name: string
}

export type TransactionItemWithProduct = TransactionItem & {
  products: TransactionProduct | null
}

export type TransactionCustomer = {
  id: string
  name: string
}

export type TransactionWithDetails = Transaction & {
  customers: TransactionCustomer | null
  transaction_items: TransactionItemWithProduct[]
}

export type CustomerTransactionSummary = {
  customerId: string
  customerName: string
  transactionCount: number
  totalAmount: number
  outstandingAmount: number
  unpaidCount: number
  transactions: TransactionWithDetails[]
}

export type ShopConfig = {
  id: string
  qris_image_url: string | null
  transfer_bank_name: string | null
  transfer_account_number: string | null
  transfer_account_holder: string | null
  created_at: string
  updated_at: string
}

export type ShopConfigInput = {
  qris_image_url?: string | null
  transfer_bank_name?: string | null
  transfer_account_number?: string | null
  transfer_account_holder?: string | null
}

export type QueueStatus = 'waiting' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export type OrderQueue = {
  id: string
  transaction_id: string
  queue_number: number
  queue_date: string
  status: QueueStatus
  table_number: string | null
  picked_up_at: string | null
  ready_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type OrderQueueWithDetails = OrderQueue & {
  transactions: TransactionWithDetails | null
}

export type StockMovementType = 'restock' | 'sale' | 'adjustment'

export type StockMovement = {
  id: string
  product_id: string
  movement_type: StockMovementType
  quantity: number
  stock_before: number
  stock_after: number
  reference_id: string | null
  unit_cost: number | null
  total_cost: number | null
  remaining_quantity: number | null
  notes: string | null
  created_at: string
}

export type StockLotAllocation = {
  id: string
  sale_movement_id: string
  lot_movement_id: string
  quantity: number
  unit_cost: number
  created_at: string
}

export type StockMovementProduct = {
  id: string
  name: string
  sku: string | null
}

export type StockMovementWithProduct = StockMovement & {
  products: StockMovementProduct | null
}

export type RestockInput = {
  product_id: string
  quantity: number
  unit_cost: number
  notes?: string | null
}

export type DateRangePreset = 'today' | '7d' | '30d' | 'month' | 'custom'

export type AnalyticsDateRange = {
  start: string
  end: string
}

export type AnalyticsSummary = {
  revenue: number
  cogs: number
  grossProfit: number
  marginPercent: number
  transactionCount: number
  paidCount: number
  paidAmount: number
  unpaidCount: number
  unpaidAmount: number
  restockSpend: number
  outstandingDebt: number
  inventoryValue: number
  salesWithoutCogsCount: number
}

export type ProductAnalyticsRow = {
  productId: string
  productName: string
  quantitySold: number
  revenue: number
  cogs: number
  grossProfit: number
  marginPercent: number
}

export type PaymentBreakdownRow = {
  method: PaymentMethod
  label: string
  transactionCount: number
  amount: number
}
