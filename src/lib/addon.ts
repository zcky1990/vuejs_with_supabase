import type { Product, TransactionItemAddonInput, TransactionItemInput, TransactionItemWithProduct } from '@/types/database'

export type CartAddonSelection = {
  product: Product
  quantity: number
}

export function hasBundleAddons(addons: CartAddonSelection[] | TransactionItemAddonInput[] | undefined) {
  return (addons?.length ?? 0) > 0
}

export function getAddonSignature(addons: { addon_product_id: string, quantity: number }[]) {
  return addons
    .slice()
    .sort((a, b) => a.addon_product_id.localeCompare(b.addon_product_id))
    .map((addon) => `${addon.addon_product_id}:${addon.quantity}`)
    .join('|')
}

export function buildCartLineKey(productId: string, addons: CartAddonSelection[]) {
  return `${productId}::${getAddonSignature(
    addons.map((addon) => ({
      addon_product_id: addon.product.id,
      quantity: addon.quantity,
    })),
  )}`
}

export function buildBundleLineKey(productId: string, addons: CartAddonSelection[]) {
  return `${buildCartLineKey(productId, addons)}::${crypto.randomUUID()}`
}

export function expandItemsForSubmit(items: TransactionItemInput[]): TransactionItemInput[] {
  return items.flatMap((item) => {
    if (!hasBundleAddons(item.addons) || item.quantity <= 1) {
      return [item]
    }

    return Array.from({ length: item.quantity }, () => ({
      product_id: item.product_id,
      quantity: 1,
      unit_price: item.unit_price,
      addons: item.addons,
    }))
  })
}

export function getAddonSubtotalPerUnit(addons: TransactionItemAddonInput[]) {
  return addons.reduce((sum, addon) => sum + addon.quantity * addon.unit_price, 0)
}

export function getLineSubtotal(
  menuQuantity: number,
  unitPrice: number,
  addons: TransactionItemAddonInput[] = [],
) {
  return menuQuantity * (unitPrice + getAddonSubtotalPerUnit(addons))
}

export function cartAddonsToInput(addons: CartAddonSelection[]): TransactionItemAddonInput[] {
  return addons.map((addon) => ({
    addon_product_id: addon.product.id,
    quantity: addon.quantity,
    unit_price: addon.product.price,
  }))
}

export function formatItemWithAddons(item: TransactionItemWithProduct) {
  const menuName = item.products?.name ?? 'Produk'
  const addons = item.transaction_item_addons ?? []

  if (!addons.length) {
    return `${menuName} x${item.quantity}`
  }

  if (item.quantity <= 1) {
    const addonNames = addons.map((addon) => addon.products?.name ?? 'Addon').join(', ')
    return `${menuName} (+ ${addonNames})`
  }

  const addonNames = addons
    .map((addon) => {
      const name = addon.products?.name ?? 'Addon'
      const totalQty = addon.quantity * item.quantity
      return totalQty > 1 ? `${name} x${totalQty}` : name
    })
    .join(', ')

  return `${menuName} x${item.quantity} (+ ${addonNames})`
}

export const TRANSACTION_ITEMS_WITH_ADDONS_SELECT = `
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
`

export const PRE_ORDER_ITEMS_WITH_ADDONS_SELECT = `
  id,
  product_id,
  quantity,
  unit_price,
  subtotal,
  products ( id, name ),
  pre_order_item_addons (
    id,
    addon_product_id,
    quantity,
    unit_price,
    subtotal,
    products ( id, name )
  )
`

export function formatPreOrderItemWithAddons(item: {
  quantity: number
  products: { name: string } | null
  pre_order_item_addons?: { quantity: number, products: { name: string } | null }[]
}) {
  const menuName = item.products?.name ?? 'Produk'
  const addons = item.pre_order_item_addons ?? []

  if (!addons.length) {
    return `${menuName} x${item.quantity}`
  }

  if (item.quantity <= 1) {
    const addonNames = addons.map((addon) => addon.products?.name ?? 'Addon').join(', ')
    return `${menuName} (+ ${addonNames})`
  }

  const addonNames = addons
    .map((addon) => {
      const name = addon.products?.name ?? 'Addon'
      const totalQty = addon.quantity * item.quantity
      return totalQty > 1 ? `${name} x${totalQty}` : name
    })
    .join(', ')

  return `${menuName} x${item.quantity} (+ ${addonNames})`
}
