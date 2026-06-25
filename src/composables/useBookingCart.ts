import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  buildBundleLineKey,
  buildCartLineKey,
  cartAddonsToInput,
  expandItemsForSubmit,
  getLineSubtotal,
  hasBundleAddons,
  type CartAddonSelection,
} from '@/lib/addon'
import { createTableBookingWithPreOrder, getBookingSlotTables } from '@/lib/booking'
import { saveBookingSuccessPayload } from '@/lib/booking-success'
import { getBookingDefaults, getShopConfig, isTableBookingEnabled } from '@/lib/config'
import { addDaysToShopDate, buildScheduledAtIso, formatShopDateTime, getShopDateString } from '@/lib/date'
import { getFloorTables } from '@/lib/floor'
import { formatPrice } from '@/lib/format'
import {
  buildMenuCategories,
  filterProductsForMenu,
  normalizeCategoryFilter,
} from '@/lib/menu-categories'
import { getProducts, getProductAddonsMap } from '@/lib/product'
import { useAlertStore } from '@/stores/useAlertStore'
import { useI18n } from '@/composables/useI18n'
import type { CanvasTable } from '@/components/floor/FloorPlanCanvas.vue'
import type { DiningTable, Product, ShopConfig } from '@/types/database'

export type BookingCartItem = {
  lineKey: string
  product: Product
  quantity: number
  addons: CartAddonSelection[]
}

export function useBookingCart() {
  const alertStore = useAlertStore()
  const { t } = useI18n()
  const router = useRouter()

  const step = ref(1)
  const products = ref<Product[]>([])
  const productAddonsMap = ref<Record<string, Product[]>>({})
  const cart = ref<BookingCartItem[]>([])
  const shopConfig = ref<ShopConfig | null>(null)
  const isLoading = ref(true)
  const isSubmitting = ref(false)
  const isLoadingTables = ref(false)

  const bookingDate = ref(getShopDateString())
  const bookingTime = ref('12:00')
  const selectedTableIds = ref<string[]>([])
  const availableTables = ref<DiningTable[]>([])
  const bookedTables = ref<DiningTable[]>([])
  const floorCanvasTables = ref<CanvasTable[]>([])
  const customerName = ref('')
  const customerPhone = ref('')
  const partySize = ref(2)
  const notes = ref('')

  const addonDialogOpen = ref(false)
  const pendingProduct = ref<Product | null>(null)
  const pendingBundleIndex = ref(1)
  const pendingBundleTotal = ref(1)
  const searchQuery = ref('')
  const categoryFilter = ref('all')
  const menuQuantities = ref<Record<string, number>>({})

  const bookingDefaults = computed(() => getBookingDefaults(shopConfig.value))
  const maxBookingDate = computed(() =>
    addDaysToShopDate(getShopDateString(), bookingDefaults.value.advanceDaysMax),
  )
  const scheduledAtIso = computed(() => buildScheduledAtIso(bookingDate.value, bookingTime.value))

  const selectedTables = computed(() =>
    availableTables.value.filter((table) => selectedTableIds.value.includes(table.id)),
  )

  const totalSelectedSeats = computed(() =>
    selectedTables.value.reduce((sum, table) => sum + table.seats, 0),
  )

  const selectedTableNumbersLabel = computed(() =>
    selectedTables.value
      .map((table) => table.table_number)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .join(', '),
  )

  const bookedDiningTableIds = computed(() =>
    bookedTables.value.map((table) => table.id),
  )

  const slotTablesForList = computed(() => [
    ...availableTables.value.map((table) => ({ table, status: 'available' as const })),
    ...bookedTables.value.map((table) => ({ table, status: 'booked' as const })),
  ].sort((a, b) =>
    a.table.table_number.localeCompare(b.table.table_number, undefined, { numeric: true }),
  ))

  const availableDiningTableIds = computed(() =>
    availableTables.value.map((table) => table.id),
  )

  const hasFloorLayout = computed(() =>
    floorCanvasTables.value.some((table) => table.kind === 'table'),
  )

  const hasSelectableTables = computed(() => availableTables.value.length > 0)

  const availableProducts = computed(() =>
    filterProductsForMenu(
      products.value.filter((product) =>
        product.stock_quantity > 0
        && product.is_active
        && !product.is_addons,
      ),
      shopConfig.value,
    ),
  )

  const menuCategories = computed(() =>
    buildMenuCategories(
      products.value.filter((product) => product.is_active && !product.is_addons),
      shopConfig.value,
    ),
  )

  watch(menuCategories, (categories) => {
    categoryFilter.value = normalizeCategoryFilter(categoryFilter.value, categories)
  })

  const filteredMenuProducts = computed(() => {
    let result = availableProducts.value

    if (categoryFilter.value !== 'all') {
      result = result.filter((product) => product.category_id === categoryFilter.value)
    }

    const query = searchQuery.value.trim().toLowerCase()
    if (query) {
      result = result.filter((product) => {
        const name = product.name.toLowerCase()
        const category = product.product_categories?.name.toLowerCase() ?? ''
        return name.includes(query) || category.includes(query)
      })
    }

    return result
  })

  const pendingProductAddons = computed(() =>
    pendingProduct.value ? (productAddonsMap.value[pendingProduct.value.id] ?? []) : [],
  )

  const totalAmount = computed(() =>
    cart.value.reduce(
      (sum, item) => sum + getLineSubtotal(
        item.quantity,
        item.product.price,
        cartAddonsToInput(item.addons),
      ),
      0,
    ),
  )

  function getCartLineSubtotal(item: BookingCartItem) {
    return getLineSubtotal(item.quantity, item.product.price, cartAddonsToInput(item.addons))
  }

  function hasEnoughStock(product: Product, addons: CartAddonSelection[], menuQuantity: number) {
    if (menuQuantity > product.stock_quantity) return false

    for (const addon of addons) {
      const required = addon.quantity * menuQuantity
      if (required > addon.product.stock_quantity) return false
    }

    return true
  }

  async function loadData() {
    isLoading.value = true

    const [productResult, addonMapResult, configResult] = await Promise.all([
      getProducts(),
      getProductAddonsMap(),
      getShopConfig(),
    ])

    isLoading.value = false

    if (configResult.error) {
      alertStore.showAlert(t('alert.error'), configResult.error.message, 'error')
      return
    }

    shopConfig.value = configResult.config
    if (!isTableBookingEnabled(configResult.config)) {
      router.replace('/')
      return
    }

    if (productResult.error) {
      alertStore.showAlert(t('alert.error'), productResult.error.message, 'error')
      return
    }

    products.value = (productResult.products ?? []).filter((product) => product.is_active)
    productAddonsMap.value = addonMapResult.map ?? {}

    const defaults = getBookingDefaults(configResult.config)
    bookingTime.value = defaults.openTime.slice(0, 5)
  }

  async function loadAvailableTables() {
    isLoadingTables.value = true
    const [slotResult, floorResult] = await Promise.all([
      getBookingSlotTables(
        scheduledAtIso.value,
        bookingDefaults.value.durationMinutes,
      ),
      getFloorTables(),
    ])
    isLoadingTables.value = false

    if (slotResult.error) {
      alertStore.showAlert(t('alert.error'), slotResult.error.message, 'error')
      availableTables.value = []
      bookedTables.value = []
      floorCanvasTables.value = []
      return false
    }

    if (floorResult.error) {
      alertStore.showAlert(t('alert.error'), floorResult.error.message, 'error')
    }

    availableTables.value = slotResult.available ?? []
    bookedTables.value = slotResult.booked ?? []
    floorCanvasTables.value = (floorResult.tables ?? []).map((table) => ({
      id: table.id,
      label: table.label,
      shape: table.shape,
      kind: table.kind,
      color: table.color,
      pos_x: table.pos_x,
      pos_y: table.pos_y,
      width: table.width,
      height: table.height,
      seats: table.seats,
      dining_table_id: table.dining_table_id,
    }))

    if (selectedTableIds.value.length) {
      selectedTableIds.value = selectedTableIds.value.filter((id) =>
        availableTables.value.some((table) => table.id === id),
      )
    }
    return true
  }

  function toggleDiningTable(diningTableId: string) {
    if (!availableTables.value.some((table) => table.id === diningTableId)) {
      return
    }

    if (selectedTableIds.value.includes(diningTableId)) {
      selectedTableIds.value = selectedTableIds.value.filter((id) => id !== diningTableId)
      return
    }

    selectedTableIds.value = [...selectedTableIds.value, diningTableId]
  }

  function isTimeInRange(time: string) {
    const open = bookingDefaults.value.openTime.slice(0, 5)
    const close = bookingDefaults.value.closeTime.slice(0, 5)
    return time >= open && time <= close
  }

  function validateScheduleStep() {
    if (bookingDate.value < getShopDateString()) {
      alertStore.showAlert(t('alert.error'), t('book.datePast'), 'error')
      return false
    }

    if (bookingDate.value > maxBookingDate.value) {
      alertStore.showAlert(t('alert.error'), t('book.dateTooFar'), 'error')
      return false
    }

    if (!isTimeInRange(bookingTime.value)) {
      alertStore.showAlert(
        t('alert.error'),
        t('book.timeOutOfRange', {
          open: bookingDefaults.value.openTime.slice(0, 5),
          close: bookingDefaults.value.closeTime.slice(0, 5),
        }),
        'error',
      )
      return false
    }

    if (new Date(scheduledAtIso.value).getTime() < Date.now()) {
      alertStore.showAlert(t('alert.error'), t('book.scheduledAtPast'), 'error')
      return false
    }

    return true
  }

  async function goToStep(target: number) {
    if (target === 2) {
      if (!validateScheduleStep()) return
      const ok = await loadAvailableTables()
      if (!ok) return
    }

    if (target === 3) {
      if (!selectedTableIds.value.length) {
        alertStore.showAlert(t('alert.error'), t('book.selectTable'), 'error')
        return
      }
    }

    if (target === 4) {
      if (!selectedTables.value.length) {
        alertStore.showAlert(t('alert.error'), t('book.selectTable'), 'error')
        return
      }

      if (partySize.value < 1) {
        alertStore.showAlert(t('alert.error'), t('validation.partySizeMin'), 'error')
        return
      }

      if (partySize.value > totalSelectedSeats.value) {
        alertStore.showAlert(t('alert.error'), t('book.partySizeExceedsSeats'), 'error')
        return
      }
    }

    step.value = target
  }

  function prevStep() {
    step.value = Math.max(1, step.value - 1)
  }

  function getCartItem(lineKey: string) {
    return cart.value.find((item) => item.lineKey === lineKey)
  }

  function addToCart(product: Product, quantity = 1, addons: CartAddonSelection[] = []) {
    if (hasBundleAddons(addons)) {
      for (let i = 0; i < quantity; i++) {
        if (!hasEnoughStock(product, addons, 1)) {
          alertStore.showAlert(t('transaction.stockInsufficient'), t('transaction.stockMenuAddon'), 'error')
          return
        }

        cart.value.push({
          lineKey: buildBundleLineKey(product.id, addons),
          product,
          quantity: 1,
          addons,
        })
      }
      return
    }

    const lineKey = buildCartLineKey(product.id, addons)
    const existing = getCartItem(lineKey)

    if (existing) {
      const nextQuantity = existing.quantity + quantity
      if (!hasEnoughStock(product, addons, nextQuantity)) {
        alertStore.showAlert(t('transaction.stockInsufficient'), t('transaction.stockMenuAddon'), 'error')
        return
      }

      existing.quantity = nextQuantity
      return
    }

    if (!hasEnoughStock(product, addons, quantity)) {
      alertStore.showAlert(t('transaction.stockOut'), t('transaction.stockOutProduct', { name: product.name }), 'error')
      return
    }

    cart.value.push({
      lineKey,
      product,
      quantity: Math.min(quantity, product.stock_quantity),
      addons,
    })
  }

  function resetPendingAddonFlow() {
    pendingProduct.value = null
    pendingBundleIndex.value = 1
    pendingBundleTotal.value = 1
  }

  function openAddonDialog(product: Product, quantity = 1) {
    const mappedAddons = productAddonsMap.value[product.id] ?? []

    if (mappedAddons.length) {
      pendingProduct.value = product
      pendingBundleTotal.value = quantity
      pendingBundleIndex.value = 1
      addonDialogOpen.value = true
      return
    }

    addToCart(product, quantity)
  }

  function handleAddonConfirm(addons: CartAddonSelection[]) {
    if (!pendingProduct.value) return

    addToCart(pendingProduct.value, 1, addons)

    if (pendingBundleIndex.value < pendingBundleTotal.value) {
      pendingBundleIndex.value++
      return
    }

    addonDialogOpen.value = false
    resetPendingAddonFlow()
  }

  function updateQuantity(lineKey: string, quantity: number) {
    const item = getCartItem(lineKey)
    if (!item) return

    if (hasBundleAddons(item.addons)) {
      if (quantity <= item.quantity) {
        removeFromCart(lineKey)
        return
      }

      openAddonDialog(item.product, quantity - item.quantity)
      return
    }

    if (quantity <= 0) {
      removeFromCart(lineKey)
      return
    }

    if (!hasEnoughStock(item.product, item.addons, quantity)) {
      alertStore.showAlert(t('transaction.stockInsufficient'), t('transaction.stockMenuAddon'), 'error')
      return
    }

    item.quantity = quantity
  }

  function removeFromCart(lineKey: string) {
    cart.value = cart.value.filter((item) => item.lineKey !== lineKey)
  }

  function clearCart() {
    cart.value = []
  }

  function getMenuQuantity(productId: string) {
    return menuQuantities.value[productId] ?? 1
  }

  function incrementMenuQuantity(productId: string, maxStock: number) {
    const next = Math.min(getMenuQuantity(productId) + 1, maxStock)
    menuQuantities.value[productId] = next
  }

  function decrementMenuQuantity(productId: string) {
    const next = Math.max(getMenuQuantity(productId) - 1, 1)
    menuQuantities.value[productId] = next
  }

  function addProductFromMenu(product: Product) {
    openAddonDialog(product, getMenuQuantity(product.id))
    menuQuantities.value[product.id] = 1
  }

  function getErrorMessage(error: unknown) {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String(error.message)
    }

    if (typeof error === 'object' && error !== null) {
      return Object.values(error).flat().join(', ')
    }

    return t('book.submitFailed')
  }

  async function submitBooking() {
    if (!cart.value.length) {
      alertStore.showAlert(t('alert.error'), t('transaction.addMinOneProduct'), 'error')
      return
    }

    if (!selectedTables.value.length) {
      alertStore.showAlert(t('alert.error'), t('book.selectTable'), 'error')
      return
    }

    isSubmitting.value = true

    const { bookings, preOrder, error } = await createTableBookingWithPreOrder({
      dining_table_ids: selectedTableIds.value,
      customer_name: customerName.value.trim() || null,
      customer_phone: customerPhone.value.trim() || null,
      party_size: partySize.value,
      scheduled_at: scheduledAtIso.value,
      notes: notes.value.trim() || null,
      items: expandItemsForSubmit(cart.value.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        addons: cartAddonsToInput(item.addons),
      }))),
    })

    isSubmitting.value = false

    if (error || !bookings?.length || !preOrder) {
      alertStore.showAlert(t('alert.error'), getErrorMessage(error), 'error')
      return
    }

    saveBookingSuccessPayload({
      bookingIds: bookings.map((booking) => booking.id),
      tableNumbers: selectedTableNumbersLabel.value,
      scheduledAt: bookings[0].scheduled_at,
      partySize: bookings[0].party_size,
      totalAmount: Number(preOrder.total_amount),
      status: bookings[0].status,
    })

    router.push('/book/success')
  }

  onMounted(loadData)

  return {
    step,
    bookingDate,
    bookingTime,
    selectedTableIds,
    availableTables,
    bookedTables,
    floorCanvasTables,
    availableDiningTableIds,
    bookedDiningTableIds,
    slotTablesForList,
    hasFloorLayout,
    hasSelectableTables,
    selectedTables,
    totalSelectedSeats,
    selectedTableNumbersLabel,
    customerName,
    customerPhone,
    partySize,
    notes,
    cart,
    searchQuery,
    categoryFilter,
    isLoading,
    isSubmitting,
    isLoadingTables,
    bookingDefaults,
    maxBookingDate,
    scheduledAtIso,
    filteredMenuProducts,
    menuCategories,
    addonDialogOpen,
    pendingProduct,
    pendingProductAddons,
    pendingBundleIndex,
    pendingBundleTotal,
    totalAmount,
    formatPrice,
    getCartLineSubtotal,
    getMenuQuantity,
    incrementMenuQuantity,
    decrementMenuQuantity,
    addProductFromMenu,
    openAddonDialog,
    handleAddonConfirm,
    updateQuantity,
    removeFromCart,
    clearCart,
    goToStep,
    prevStep,
    toggleDiningTable,
    submitBooking,
    loadAvailableTables,
  }
}
