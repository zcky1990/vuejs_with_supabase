export type ProductCategory = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ProductCategoryInput = Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>

export type ProductCategorySummary = {
  id: string
  name: string
}

export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  purchase_price: number
  stock_quantity: number
  sku: string | null
  image_url: string | null
  is_addons: boolean
  category_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  product_categories?: ProductCategorySummary | null
}

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'product_categories'>

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

export type TransactionStatus = 'active' | 'cancelled'

export type TransactionEventType = 'cancelled'

export type Transaction = {
  id: string
  customer_id: string
  total_amount: number
  is_paid: boolean
  payment_method: PaymentMethod | null
  paid_at: string | null
  shift_id: string | null
  status: TransactionStatus
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type TransactionEvent = {
  id: string
  transaction_id: string
  event_type: TransactionEventType
  performed_by: string | null
  reason: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export type TransactionEventWithPerformer = TransactionEvent & {
  profiles: { full_name: string | null, email: string | null } | null
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

export type ProductAddon = {
  id: string
  product_id: string
  addon_product_id: string
  sort_order: number
}

export type TransactionItemAddon = {
  id: string
  transaction_item_id: string
  addon_product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export type TransactionItemAddonInput = {
  addon_product_id: string
  quantity: number
  unit_price: number
}

export type TransactionItemAddonWithProduct = TransactionItemAddon & {
  products: TransactionProduct | null
}

export type TransactionItemInput = {
  product_id: string
  quantity: number
  unit_price: number
  addons?: TransactionItemAddonInput[]
}

export type TransactionProduct = {
  id: string
  name: string
}

export type TransactionItemWithProduct = TransactionItem & {
  products: TransactionProduct | null
  transaction_item_addons?: TransactionItemAddonWithProduct[]
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

export type UserRole = 'owner' | 'staff'

export type AppRole = {
  code: UserRole
  sort_order: number
}

export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export type ShopConfig = {
  id: string
  shop_name: string | null
  shop_address: string | null
  qris_image_url: string | null
  transfer_bank_name: string | null
  transfer_account_number: string | null
  transfer_account_holder: string | null
  created_at: string
  updated_at: string
}

export type ShopConfigInput = {
  shop_name?: string | null
  shop_address?: string | null
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

export type PreOrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'

export type PreOrderPaymentChoice = 'pay_later' | 'pay_now'

export type PreOrderPaymentStatus = 'unpaid' | 'awaiting_confirmation' | 'confirmed'

export type PreOrder = {
  id: string
  order_number: number
  order_date: string
  customer_name: string | null
  table_number: string | null
  notes: string | null
  status: PreOrderStatus
  payment_choice: PreOrderPaymentChoice
  payment_status: PreOrderPaymentStatus
  confirmed_payment_method: PaymentMethod | null
  total_amount: number
  transaction_id: string | null
  created_at: string
  updated_at: string
}

export type PreOrderItem = {
  id: string
  pre_order_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export type PreOrderItemAddon = {
  id: string
  pre_order_item_id: string
  addon_product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export type PreOrderItemAddonWithProduct = PreOrderItemAddon & {
  products: TransactionProduct | null
}

export type PreOrderItemWithProduct = PreOrderItem & {
  products: TransactionProduct | null
  pre_order_item_addons?: PreOrderItemAddonWithProduct[]
}

export type PreOrderWithDetails = PreOrder & {
  pre_order_items: PreOrderItemWithProduct[]
}

export type PreOrderItemInput = {
  product_id: string
  quantity: number
  unit_price: number
  addons?: TransactionItemAddonInput[]
}

export type PreOrderInput = {
  customer_name?: string | null
  table_number?: string | null
  notes?: string | null
  payment_choice: PreOrderPaymentChoice
  items: PreOrderItemInput[]
}

export type ProcessPreOrderOptions = {
  paymentMethod?: PaymentMethod
  addToQueue?: boolean
  tableNumber?: string | null
}

export type StockMovementType = 'restock' | 'sale' | 'adjustment' | 'opname'

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
  performed_by: string | null
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
  profiles?: { full_name: string | null, email: string | null } | null
}

export type StockOpnameInput = {
  product_id: string
  physical_count: number
  reason: string
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

export type DailyAnalyticsRow = {
  dateKey: string
  dateLabel: string
  revenue: number
  cogs: number
  grossProfit: number
  transactionCount: number
}

export type CashierShiftStatus = 'open' | 'closed'

export type CashierShift = {
  id: string
  cashier_id: string
  shift_date: string
  opened_at: string
  closed_at: string | null
  opening_balance: number
  total_sales: number | null
  cash_sales: number | null
  qris_sales: number | null
  transfer_sales: number | null
  transaction_count: number | null
  closing_balance_expected: number | null
  closing_balance_actual: number | null
  cash_variance: number | null
  notes: string | null
  status: CashierShiftStatus
  created_at: string
  updated_at: string
}

export type ShiftLiveTotals = {
  transactionCount: number
  totalSales: number
  cashSales: number
  qrisSales: number
  transferSales: number
  expectedCashInDrawer: number
  payments: PaymentBreakdownRow[]
}
