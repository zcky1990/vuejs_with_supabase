import type { Product, ShopConfig } from '@/types/database'

export type MenuCategoryOption = {
  id: string
  name: string
}

export function usesCustomMenuCategories(config: ShopConfig | null) {
  const ids = config?.menu_category_ids
  return Array.isArray(ids) && ids.length > 0
}

export function getMenuCategoryIds(config: ShopConfig | null): string[] | null {
  if (!usesCustomMenuCategories(config)) return null
  return config!.menu_category_ids!
}

function isMenuProduct(product: Product) {
  return !product.is_addons
}

export function filterProductsForMenu(products: Product[], config: ShopConfig | null) {
  const menuProducts = products.filter(isMenuProduct)
  const categoryIds = getMenuCategoryIds(config)

  if (!categoryIds) {
    return menuProducts
  }

  const allowed = new Set(categoryIds)
  return menuProducts.filter(
    (product) => product.category_id && allowed.has(product.category_id),
  )
}

export function buildMenuCategories(
  products: Product[],
  config: ShopConfig | null,
): MenuCategoryOption[] {
  const menuProducts = filterProductsForMenu(products, config)
  const categoryIds = getMenuCategoryIds(config)
  const map = new Map<string, MenuCategoryOption>()

  for (const product of menuProducts) {
    const category = product.product_categories
    if (category) {
      map.set(category.id, { id: category.id, name: category.name })
    }
  }

  if (categoryIds) {
    return categoryIds
      .map((id) => map.get(id))
      .filter((category): category is MenuCategoryOption => category !== undefined)
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function normalizeCategoryFilter(
  categoryFilter: string,
  categories: MenuCategoryOption[],
) {
  if (categoryFilter === 'all') return 'all'
  return categories.some((category) => category.id === categoryFilter) ? categoryFilter : 'all'
}
