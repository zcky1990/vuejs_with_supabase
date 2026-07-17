import { restockSchema, stockOpnameSchema } from '@/schema/schema'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { getCurrentUser } from './auth'
import { supabase } from './supabase'
import type {
  Product,
  RestockInput,
  StockMovement,
  StockMovementType,
  StockMovementWithProduct,
  StockOpnameInput,
} from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

type ApplyStockMovementOptions = {
  referenceId?: string | null
  notes?: string | null
  unitCost?: number | null
  totalCost?: number | null
  remainingQuantity?: number | null
}

type LotAllocation = {
  lotId: string
  quantity: number
  unitCost: number
}

async function consumeFifoLots(
  supabaseClient: SupabaseClient,
  productId: string,
  quantity: number,
) {
  const { data: lots, error } = await supabaseClient
    .from('stock_movements')
    .select('id, remaining_quantity, unit_cost')
    .eq('product_id', productId)
    .eq('movement_type', 'restock')
    .gt('remaining_quantity', 0)
    .order('created_at', { ascending: true })

  if (error) {
    return { error, allocations: [] as LotAllocation[], totalCost: 0 }
  }

  let remaining = quantity
  const allocations: LotAllocation[] = []
  let totalCost = 0

  for (const lot of lots ?? []) {
    if (remaining <= 0) break

    const lotRemaining = lot.remaining_quantity ?? 0
    if (lotRemaining <= 0) continue

    const take = Math.min(remaining, lotRemaining)
    const unitCost = Number(lot.unit_cost ?? 0)

    allocations.push({ lotId: lot.id, quantity: take, unitCost })
    totalCost += take * unitCost
    remaining -= take

    const { error: updateError } = await supabaseClient
      .from('stock_movements')
      .update({ remaining_quantity: lotRemaining - take })
      .eq('id', lot.id)

    if (updateError) {
      return { error: updateError, allocations: [], totalCost: 0 }
    }
  }

  if (remaining > 0) {
    return {
      error: { message: useLocaleStore().translate('error.stockBatchInsufficient') },
      allocations: [],
      totalCost: 0,
    }
  }

  return { error: null, allocations, totalCost }
}

async function consumeFifoLotsBestEffort(
  supabaseClient: SupabaseClient,
  productId: string,
  quantity: number,
) {
  const { data: lots, error } = await supabaseClient
    .from('stock_movements')
    .select('id, remaining_quantity, unit_cost')
    .eq('product_id', productId)
    .eq('movement_type', 'restock')
    .gt('remaining_quantity', 0)
    .order('created_at', { ascending: true })

  if (error) {
    return { error, allocations: [] as LotAllocation[], totalCost: 0 }
  }

  let remaining = quantity
  const allocations: LotAllocation[] = []
  let totalCost = 0

  for (const lot of lots ?? []) {
    if (remaining <= 0) break

    const lotRemaining = lot.remaining_quantity ?? 0
    if (lotRemaining <= 0) continue

    const take = Math.min(remaining, lotRemaining)
    const unitCost = Number(lot.unit_cost ?? 0)

    allocations.push({ lotId: lot.id, quantity: take, unitCost })
    totalCost += take * unitCost
    remaining -= take

    const { error: updateError } = await supabaseClient
      .from('stock_movements')
      .update({ remaining_quantity: lotRemaining - take })
      .eq('id', lot.id)

    if (updateError) {
      return { error: updateError, allocations: [], totalCost: 0 }
    }
  }

  return { error: null, allocations, totalCost }
}

async function insertLotAllocations(
  supabaseClient: SupabaseClient,
  saleMovementId: string,
  allocations: LotAllocation[],
) {
  if (!allocations.length) return { error: null }

  const rows = allocations.map((allocation) => ({
    sale_movement_id: saleMovementId,
    lot_movement_id: allocation.lotId,
    quantity: allocation.quantity,
    unit_cost: allocation.unitCost,
  }))

  const { error } = await supabaseClient.from('stock_lot_allocations').insert(rows)
  return { error }
}

async function reverseFifoFromTransaction(
  supabaseClient: SupabaseClient,
  productId: string,
  transactionId: string,
  quantity: number,
) {
  const { data: saleMovements, error: saleError } = await supabaseClient
    .from('stock_movements')
    .select('id')
    .eq('product_id', productId)
    .eq('movement_type', 'sale')
    .eq('reference_id', transactionId)
    .order('created_at', { ascending: false })

  if (saleError) {
    return { error: saleError }
  }

  let remaining = quantity

  for (const saleMovement of saleMovements ?? []) {
    if (remaining <= 0) break

    const { data: allocations, error: allocError } = await supabaseClient
      .from('stock_lot_allocations')
      .select('id, lot_movement_id, quantity, unit_cost')
      .eq('sale_movement_id', saleMovement.id)
      .order('created_at', { ascending: false })

    if (allocError) {
      return { error: allocError }
    }

    for (const allocation of allocations ?? []) {
      if (remaining <= 0) break

      const restoreQty = Math.min(remaining, allocation.quantity)

      const { data: lot, error: lotError } = await supabaseClient
        .from('stock_movements')
        .select('remaining_quantity')
        .eq('id', allocation.lot_movement_id)
        .single()

      if (lotError || !lot) {
        return { error: lotError ?? { message: useLocaleStore().translate('error.stockBatchNotFound') } }
      }

      const { error: lotUpdateError } = await supabaseClient
        .from('stock_movements')
        .update({ remaining_quantity: (lot.remaining_quantity ?? 0) + restoreQty })
        .eq('id', allocation.lot_movement_id)

      if (lotUpdateError) {
        return { error: lotUpdateError }
      }

      if (restoreQty === allocation.quantity) {
        const { error: deleteError } = await supabaseClient
          .from('stock_lot_allocations')
          .delete()
          .eq('id', allocation.id)

        if (deleteError) {
          return { error: deleteError }
        }
      } else {
        const { error: updateAllocError } = await supabaseClient
          .from('stock_lot_allocations')
          .update({ quantity: allocation.quantity - restoreQty })
          .eq('id', allocation.id)

        if (updateAllocError) {
          return { error: updateAllocError }
        }
      }

      remaining -= restoreQty
    }
  }

  if (remaining > 0) {
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('purchase_price')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return { error: productError ?? { message: useLocaleStore().translate('error.productNotFound') } }
    }

    const unitCost = Number(product.purchase_price ?? 0)

    const { data: currentProduct } = await supabaseClient
      .from('products')
      .select('stock_quantity')
      .eq('id', productId)
      .single()

    const currentStock = currentProduct?.stock_quantity ?? 0

    const { error: fallbackError } = await createRestockBatch(supabaseClient, {
      productId,
      quantity: remaining,
      unitCost,
      notes: 'Pengembalian stok (batch baru)',
      skipProductUpdate: true,
      stockBefore: currentStock,
      stockAfter: currentStock,
    })

    if (fallbackError) {
      return { error: fallbackError }
    }
  }

  return { error: null }
}

async function createRestockBatch(
  supabaseClient: SupabaseClient,
  input: {
    productId: string
    quantity: number
    unitCost: number
    notes?: string | null
    skipProductUpdate?: boolean
    stockBefore?: number | null
    stockAfter?: number | null
  },
) {
  const totalCost = input.quantity * input.unitCost
  let stockBefore = input.stockBefore ?? 0
  let stockAfter = input.stockAfter ?? input.quantity

  if (!input.skipProductUpdate) {
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('stock_quantity')
      .eq('id', input.productId)
      .single()

    if (productError || !product) {
      return { movement: null, error: productError ?? { message: useLocaleStore().translate('error.productNotFound') } }
    }

    stockBefore = product.stock_quantity
    stockAfter = stockBefore + input.quantity
  }

  const { data: movement, error: movementError } = await supabaseClient
    .from('stock_movements')
    .insert({
      product_id: input.productId,
      movement_type: 'restock',
      quantity: input.quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      unit_cost: input.unitCost,
      total_cost: totalCost,
      remaining_quantity: input.quantity,
      notes: input.notes ?? null,
    })
    .select()
    .single()

  if (movementError || !movement) {
    return { movement: null, error: movementError }
  }

  if (!input.skipProductUpdate) {
    const { error: updateError } = await supabaseClient
      .from('products')
      .update({ stock_quantity: stockAfter })
      .eq('id', input.productId)

    if (updateError) {
      return { movement: null, error: updateError }
    }
  }

  return { movement: movement as StockMovement, error: null }
}

export async function applyStockMovement(
  productId: string,
  movementType: StockMovementType,
  quantity: number,
  options?: ApplyStockMovementOptions,
) {
  if (quantity <= 0) {
    return { movement: null, error: { message: useLocaleStore().translate('error.stockQtyMustBePositive') } }
  }

  const supabaseClient = supabase()

  if (movementType === 'restock') {
    const unitCost = options?.unitCost ?? 0
    return createRestockBatch(supabaseClient, {
      productId,
      quantity,
      unitCost,
      notes: options?.notes ?? null,
    })
  }

  const { data: product, error: productError } = await supabaseClient
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    return { movement: null, error: productError ?? { message: useLocaleStore().translate('error.productNotFound') } }
  }

  const stockBefore = product.stock_quantity
  let stockAfter = stockBefore
  let totalCost: number | null = options?.totalCost ?? null
  let allocations: LotAllocation[] = []

  if (movementType === 'sale') {
    if (stockBefore < quantity) {
      return { movement: null, error: { message: useLocaleStore().translate('error.productStockInsufficient') } }
    }

    const fifo = await consumeFifoLots(supabaseClient, productId, quantity)
    if (fifo.error) {
      // If no restock batches exist (product has stock but no lots),
      // allocate remaining stock at zero cost rather than blocking the sale
      const bestEffort = await consumeFifoLotsBestEffort(supabaseClient, productId, quantity)
      allocations = bestEffort.allocations
      totalCost = bestEffort.totalCost
      stockAfter = stockBefore - quantity
    } else {
      allocations = fifo.allocations
      totalCost = fifo.totalCost
      stockAfter = stockBefore - quantity
    }
  } else {
    stockAfter = stockBefore + quantity
  }

  const { data: movement, error: movementError } = await supabaseClient
    .from('stock_movements')
    .insert({
      product_id: productId,
      movement_type: movementType,
      quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      reference_id: options?.referenceId ?? null,
      unit_cost: movementType === 'sale' && quantity > 0 ? totalCost! / quantity : null,
      total_cost: totalCost,
      notes: options?.notes ?? null,
    })
    .select()
    .single()

  if (movementError || !movement) {
    return { movement: null, error: movementError }
  }

  if (movementType === 'sale' && allocations.length) {
    const { error: allocError } = await insertLotAllocations(
      supabaseClient,
      movement.id,
      allocations,
    )

    if (allocError) {
      return { movement: null, error: allocError }
    }
  }

  const { error: updateError } = await supabaseClient
    .from('products')
    .update({ stock_quantity: stockAfter })
    .eq('id', productId)

  if (updateError) {
    return { movement: null, error: updateError }
  }

  return { movement: movement as StockMovement, error: null }
}

export async function recordInitialStockMovement(
  productId: string,
  quantity: number,
  unitCost = 0,
  notes?: string,
) {
  const movementNotes = notes ?? useLocaleStore().translate('error.initialStockNotes')
  if (quantity <= 0) {
    return { movement: null, error: null }
  }

  const supabaseClient = supabase()
  const totalCost = quantity * unitCost

  const { data: movement, error } = await supabaseClient
    .from('stock_movements')
    .insert({
      product_id: productId,
      movement_type: 'restock',
      quantity,
      stock_before: 0,
      stock_after: quantity,
      unit_cost: unitCost,
      total_cost: totalCost,
      remaining_quantity: quantity,
      notes: movementNotes,
    })
    .select()
    .single()

  return { movement: movement as StockMovement | null, error }
}

export const restockProduct = async (input: RestockInput) => {
  const validated = restockSchema().safeParse(input)
  if (!validated.success) {
    return { movement: null, error: validated.error.flatten().fieldErrors }
  }

  return applyStockMovement(validated.data.product_id, 'restock', validated.data.quantity, {
    notes: validated.data.notes ?? null,
    unitCost: validated.data.unit_cost,
  })
}

export const applyStockOpname = async (input: StockOpnameInput) => {
  const validated = stockOpnameSchema().safeParse(input)
  if (!validated.success) {
    return { movement: null, error: validated.error.flatten().fieldErrors }
  }

  const { user, error: userError } = await getCurrentUser()
  if (userError || !user) {
    return {
      movement: null,
      error: userError ?? { message: useLocaleStore().translate('shift.userRequired') },
    }
  }

  const supabaseClient = supabase()
  const { data: product, error: productError } = await supabaseClient
    .from('products')
    .select('stock_quantity, purchase_price')
    .eq('id', validated.data.product_id)
    .single()

  if (productError || !product) {
    return { movement: null, error: productError ?? { message: useLocaleStore().translate('error.productNotFound') } }
  }

  const stockBefore = product.stock_quantity
  const physicalCount = validated.data.physical_count
  const delta = physicalCount - stockBefore

  if (delta === 0) {
    return { movement: null, error: { message: useLocaleStore().translate('opname.noDifference') } }
  }

  const quantity = Math.abs(delta)
  const stockAfter = physicalCount
  const reason = validated.data.reason.trim()
  let allocations: LotAllocation[] = []
  let totalCost: number | null = null
  let unitCost: number | null = null
  let remainingQuantity: number | null = null

  if (delta < 0) {
    const fifo = await consumeFifoLotsBestEffort(supabaseClient, validated.data.product_id, quantity)
    if (fifo.error) {
      return { movement: null, error: fifo.error }
    }

    allocations = fifo.allocations
    totalCost = fifo.totalCost
    unitCost = quantity > 0 ? totalCost / quantity : null
  } else {
    unitCost = Number(product.purchase_price ?? 0)
    totalCost = quantity * unitCost
    remainingQuantity = quantity
  }

  const { data: movement, error: movementError } = await supabaseClient
    .from('stock_movements')
    .insert({
      product_id: validated.data.product_id,
      movement_type: 'opname',
      quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      unit_cost: unitCost,
      total_cost: totalCost,
      remaining_quantity: remainingQuantity,
      notes: reason,
      performed_by: user.id,
    })
    .select()
    .single()

  if (movementError || !movement) {
    return { movement: null, error: movementError }
  }

  if (delta < 0 && allocations.length) {
    const { error: allocError } = await insertLotAllocations(
      supabaseClient,
      movement.id,
      allocations,
    )

    if (allocError) {
      return { movement: null, error: allocError }
    }
  }

  const { error: updateError } = await supabaseClient
    .from('products')
    .update({ stock_quantity: stockAfter })
    .eq('id', validated.data.product_id)

  if (updateError) {
    return { movement: null, error: updateError }
  }

  return { movement: movement as StockMovement, error: null }
}

export const recordSaleMovement = async (
  productId: string,
  quantity: number,
  transactionId: string,
) => applyStockMovement(productId, 'sale', quantity, { referenceId: transactionId })

export const recordStockReturn = async (
  productId: string,
  quantity: number,
  options?: { referenceId?: string, notes?: string },
) => {
  const supabaseClient = supabase()
  const { data: product, error: productError } = await supabaseClient
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    return { movement: null, error: productError ?? { message: useLocaleStore().translate('error.productNotFound') } }
  }

  const stockBefore = product.stock_quantity
  const stockAfter = stockBefore + quantity

  if (options?.referenceId) {
    const { error: reverseError } = await reverseFifoFromTransaction(
      supabaseClient,
      productId,
      options.referenceId,
      quantity,
    )

    if (reverseError) {
      return { movement: null, error: reverseError }
    }
  }

  const { data: movement, error: movementError } = await supabaseClient
    .from('stock_movements')
    .insert({
      product_id: productId,
      movement_type: 'adjustment',
      quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      reference_id: options?.referenceId ?? null,
      notes: options?.notes ?? 'Pengembalian stok',
    })
    .select()
    .single()

  if (movementError || !movement) {
    return { movement: null, error: movementError }
  }

  const { error: updateError } = await supabaseClient
    .from('products')
    .update({ stock_quantity: stockAfter })
    .eq('id', productId)

  if (updateError) {
    return { movement: null, error: updateError }
  }

  return { movement: movement as StockMovement, error: null }
}

export async function restoreTransactionStock(
  items: {
    product_id: string
    quantity: number
    transaction_item_addons?: { addon_product_id: string, quantity: number }[]
  }[],
  transactionId: string,
  notes?: string,
) {
  const returnNotes = notes ?? useLocaleStore().translate('stock.returnFromCancel')

  for (const item of items) {
    const { error } = await recordStockReturn(item.product_id, item.quantity, {
      referenceId: transactionId,
      notes: returnNotes,
    })

    if (error) {
      return { error }
    }

    for (const addon of item.transaction_item_addons ?? []) {
      const { error: addonError } = await recordStockReturn(
        addon.addon_product_id,
        item.quantity * addon.quantity,
        {
          referenceId: transactionId,
          notes: returnNotes,
        },
      )

      if (addonError) {
        return { error: addonError }
      }
    }
  }

  return { error: null }
}

export const getStockMovements = async (filters?: {
  productId?: string
  movementType?: StockMovementType
  limit?: number
}) => {
  const supabaseClient = supabase()
  let query = supabaseClient
    .from('stock_movements')
    .select(`
      *,
      products ( id, name, sku ),
      profiles:performed_by ( full_name, email )
    `)
    .order('created_at', { ascending: false })

  if (filters?.productId) {
    query = query.eq('product_id', filters.productId)
  }

  if (filters?.movementType) {
    query = query.eq('movement_type', filters.movementType)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  return { movements: data as StockMovementWithProduct[] | null, error }
}

export const getLowStockProducts = async (threshold = 5) => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .eq('is_active', true)
    .lte('stock_quantity', threshold)
    .order('stock_quantity', { ascending: true })

  return { products: data as Product[] | null, error }
}

export async function recordSaleStock(
  items: {
    product_id: string
    quantity: number
    addons?: { addon_product_id: string, quantity: number }[]
  }[],
  transactionId: string,
) {
  for (const item of items) {
    const { error } = await recordSaleMovement(item.product_id, item.quantity, transactionId)
    if (error) {
      return { error }
    }

    for (const addon of item.addons ?? []) {
      const { error: addonError } = await recordSaleMovement(
        addon.addon_product_id,
        item.quantity * addon.quantity,
        transactionId,
      )

      if (addonError) {
        return { error: addonError }
      }
    }
  }

  return { error: null }
}

export async function applyStockDelta(
  productId: string,
  quantityDelta: number,
  transactionId: string,
) {
  if (quantityDelta === 0) return { error: null }

  if (quantityDelta > 0) {
    return recordSaleMovement(productId, quantityDelta, transactionId)
  }

  return recordStockReturn(productId, Math.abs(quantityDelta), {
    referenceId: transactionId,
    notes: 'Penyesuaian dari edit transaksi',
  })
}
