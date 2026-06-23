import { computed, onMounted, ref, watch } from 'vue'
import { buildBundleLineKey, buildCartLineKey, cartAddonsToInput, expandItemsForSubmit, getLineSubtotal, hasBundleAddons, type CartAddonSelection } from '@/lib/addon'
import { formatPrice, formatQueueNumber } from '@/lib/format'
import { getProducts, getProductAddonsMap } from '@/lib/product'
import { createQueueEntry } from '@/lib/queue'
import { isWalkInCustomer } from '@/lib/customer'
import { createTransaction, getCustomersForTransaction, getPendingTransactionForCustomer } from '@/lib/transaction'
import { useAlertStore } from '@/stores/useAlertStore'
import type { Customer, PaymentMethod, Product, Transaction } from '@/types/database'
import { WALK_IN_CUSTOMER_NAME } from '@/types/database'

export type CartItem = {
  lineKey: string
  product: Product
  quantity: number
  addons: CartAddonSelection[]
}

export function useTransactionCart() {
  const alertStore = useAlertStore()
  const customers = ref<Customer[]>([])
  const products = ref<Product[]>([])
  const productAddonsMap = ref<Record<string, Product[]>>({})
  const selectedCustomerId = ref('')
  const selectedProductId = ref('')
  const addQuantity = ref(1)
  const notes = ref('')
  const cart = ref<CartItem[]>([])
  const pendingTransaction = ref<Transaction | null>(null)
  const isLoading = ref(true)
  const isSubmitting = ref(false)
  const paymentDialogOpen = ref(false)
  const paymentWithQueue = ref(false)
  const tableDialogOpen = ref(false)
  const pendingQueueAction = ref<'debt' | 'pay' | null>(null)
  const pendingTableNumber = ref<string | null>(null)
  const addonDialogOpen = ref(false)
  const pendingProduct = ref<Product | null>(null)
  const pendingQuantity = ref(1)

const selectedCustomer = computed(() =>
  customers.value.find((customer) => customer.id === selectedCustomerId.value) ?? null,
)

const requiresImmediatePayment = computed(() => isWalkInCustomer(selectedCustomer.value))

  const selectedProduct = computed(() =>
    products.value.find((product) => product.id === selectedProductId.value) ?? null,
  )

  const availableProducts = computed(() =>
    products.value.filter((product) =>
      product.stock_quantity > 0
      && !product.is_addons,
    ),
  )

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

  function getCartLineSubtotal(item: CartItem) {
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

    const [customerResult, productResult, addonMapResult] = await Promise.all([
      getCustomersForTransaction(),
      getProducts(),
      getProductAddonsMap(),
    ])

    isLoading.value = false

    if (customerResult.error) {
      alertStore.showAlert('Error', customerResult.error.message, 'error')
    } else {
      customers.value = customerResult.customers
      const walkIn = customerResult.customers.find((customer) => customer.name === WALK_IN_CUSTOMER_NAME)
      selectedCustomerId.value = walkIn?.id ?? customerResult.customers[0]?.id ?? ''
    }

    if (productResult.error) {
      alertStore.showAlert('Error', productResult.error.message, 'error')
      return
    }

    products.value = (productResult.products ?? []).filter((product) => product.is_active)
    productAddonsMap.value = addonMapResult.map ?? {}
    await loadPendingTransaction()
  }

  async function loadPendingTransaction() {
    if (!selectedCustomerId.value) {
      pendingTransaction.value = null
      return
    }

    const { transaction, error } = await getPendingTransactionForCustomer(selectedCustomerId.value)
    if (error) {
      pendingTransaction.value = null
      return
    }

    pendingTransaction.value = transaction as Transaction | null
  }

  watch(selectedCustomerId, loadPendingTransaction)

  function getCartItem(lineKey: string) {
    return cart.value.find((item) => item.lineKey === lineKey)
  }

  function addToCart(product: Product, quantity = 1, addons: CartAddonSelection[] = []) {
    if (hasBundleAddons(addons)) {
      for (let i = 0; i < quantity; i++) {
        if (!hasEnoughStock(product, addons, 1)) {
          alertStore.showAlert('Stok tidak cukup', 'Stok menu atau addon tidak mencukupi', 'error')
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
        alertStore.showAlert('Stok tidak cukup', 'Stok menu atau addon tidak mencukupi', 'error')
        return
      }

      existing.quantity = nextQuantity
      return
    }

    if (!hasEnoughStock(product, addons, quantity)) {
      alertStore.showAlert('Stok habis', `${product.name} atau addon tidak tersedia`, 'error')
      return
    }

    cart.value.push({
      lineKey,
      product,
      quantity: Math.min(quantity, product.stock_quantity),
      addons,
    })
  }

  function handleAddSelectedProduct() {
    if (!selectedProduct.value) {
      alertStore.showAlert('Error', 'Pilih produk terlebih dahulu', 'error')
      return
    }

    if (addQuantity.value < 1) {
      alertStore.showAlert('Error', 'Jumlah minimal 1', 'error')
      return
    }

    const mappedAddons = productAddonsMap.value[selectedProduct.value.id] ?? []

    if (mappedAddons.length) {
      pendingProduct.value = selectedProduct.value
      pendingQuantity.value = addQuantity.value
      addonDialogOpen.value = true
      return
    }

    addToCart(selectedProduct.value, addQuantity.value)
    selectedProductId.value = ''
    addQuantity.value = 1
  }

  function handleAddonConfirm(addons: CartAddonSelection[]) {
    if (!pendingProduct.value) return

    addToCart(pendingProduct.value, pendingQuantity.value, addons)
    pendingProduct.value = null
    pendingQuantity.value = 1
    selectedProductId.value = ''
    addQuantity.value = 1
  }

  function updateQuantity(lineKey: string, quantity: number) {
    const item = getCartItem(lineKey)
    if (!item) return

    if (hasBundleAddons(item.addons)) {
      if (quantity <= item.quantity) {
        removeFromCart(lineKey)
        return
      }

      if (!hasEnoughStock(item.product, item.addons, 1)) {
        alertStore.showAlert('Stok tidak cukup', 'Stok menu atau addon tidak mencukupi', 'error')
        return
      }

      cart.value.push({
        lineKey: buildBundleLineKey(item.product.id, item.addons),
        product: item.product,
        quantity: 1,
        addons: item.addons,
      })
      return
    }

    if (quantity <= 0) {
      removeFromCart(lineKey)
      return
    }

    if (!hasEnoughStock(item.product, item.addons, quantity)) {
      alertStore.showAlert('Stok tidak cukup', 'Stok menu atau addon tidak mencukupi', 'error')
      return
    }

    item.quantity = quantity
  }

  function removeFromCart(lineKey: string) {
    cart.value = cart.value.filter((item) => item.lineKey !== lineKey)
  }

  function resetForm() {
    cart.value = []
    notes.value = ''
    selectedProductId.value = ''
    addQuantity.value = 1
    const walkIn = customers.value.find((customer) => customer.name === WALK_IN_CUSTOMER_NAME)
    selectedCustomerId.value = walkIn?.id ?? customers.value[0]?.id ?? ''
  }

  function validateCart() {
    if (!selectedCustomerId.value) {
      alertStore.showAlert('Error', 'Pilih pembeli terlebih dahulu', 'error')
      return false
    }

    if (!cart.value.length) {
      alertStore.showAlert('Error', 'Tambahkan minimal 1 produk', 'error')
      return false
    }

    return true
  }

  function getTransactionPayload() {
    const items = cart.value.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      addons: cartAddonsToInput(item.addons),
    }))

    return {
      customer_id: selectedCustomerId.value,
      notes: notes.value || null,
      items: expandItemsForSubmit(items),
    }
  }

  function getErrorMessage(error: unknown) {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String(error.message)
    }

    if (typeof error === 'object' && error !== null) {
      return Object.values(error).flat().join(', ')
    }

    return 'Gagal menyimpan transaksi'
  }

  async function createQueueForTransaction(transactionId: string, tableNumber: string | null = null) {
    const { queue, error } = await createQueueEntry(transactionId, { tableNumber })

    if (error) {
      alertStore.showAlert('Error', `Transaksi tersimpan, tetapi antrian gagal: ${error.message}`, 'error')
      return null
    }

    return queue
  }

  function queueSuccessMessage(queueNumber: number, tableNumber: string | null, prefix: string) {
    const tableLabel = tableNumber ? ` · Meja ${tableNumber}` : ''
    return `${prefix} ${formatQueueNumber(queueNumber)}${tableLabel}`
  }

  async function handleSubmit(addToQueue = false, tableNumber: string | null = null) {
    if (!validateCart()) return

    if (requiresImmediatePayment.value) {
      alertStore.showAlert('Perhatian', 'Pembeli walk-in harus bayar langsung, tidak bisa berhutang', 'error')
      return
    }

    isSubmitting.value = true

    const { transaction, merged, error } = await createTransaction(getTransactionPayload())

    if (error) {
      isSubmitting.value = false
      alertStore.showAlert('Error', getErrorMessage(error), 'error')
      return
    }

    if (addToQueue && transaction) {
      const queue = await createQueueForTransaction(transaction.id, tableNumber)
      isSubmitting.value = false

      if (!queue) {
        resetForm()
        await loadData()
        return
      }

      alertStore.showAlert(
        'Berhasil',
        merged
          ? queueSuccessMessage(queue.queue_number, tableNumber, 'Hutang diperbarui & antrian')
          : queueSuccessMessage(queue.queue_number, tableNumber, 'Transaksi hutang & antrian'),
        'success',
      )
    } else {
      isSubmitting.value = false
      alertStore.showAlert(
        'Berhasil',
        merged
          ? 'Pembelian ditambahkan ke transaksi belum dibayar hari ini'
          : 'Transaksi baru berhasil dibuat',
        'success',
      )
    }

    resetForm()
    await loadData()
  }

  function openQueueFlow(action: 'debt' | 'pay') {
    if (!validateCart()) return

    if (action === 'debt' && requiresImmediatePayment.value) {
      alertStore.showAlert('Perhatian', 'Pembeli walk-in harus bayar langsung, tidak bisa berhutang', 'error')
      return
    }

    pendingQueueAction.value = action
    tableDialogOpen.value = true
  }

  function handleTableNumberConfirm(tableNumber: string | null) {
    if (pendingQueueAction.value === 'debt') {
      pendingQueueAction.value = null
      handleSubmit(true, tableNumber)
      return
    }

    if (pendingQueueAction.value === 'pay') {
      pendingTableNumber.value = tableNumber
      pendingQueueAction.value = null
      paymentWithQueue.value = true
      paymentDialogOpen.value = true
    }
  }

  function openPaymentDialog(withQueue = false) {
    if (!validateCart()) return
    paymentWithQueue.value = withQueue
    pendingTableNumber.value = null
    paymentDialogOpen.value = true
  }

  async function handlePayment(method: PaymentMethod) {
    isSubmitting.value = true
    const addToQueue = paymentWithQueue.value
    const tableNumber = pendingTableNumber.value

    const { transaction, error } = await createTransaction(getTransactionPayload(), { paymentMethod: method })

    if (error) {
      isSubmitting.value = false
      paymentDialogOpen.value = false
      paymentWithQueue.value = false
      pendingTableNumber.value = null
      alertStore.showAlert('Error', getErrorMessage(error), 'error')
      return
    }

    if (addToQueue && transaction) {
      const queue = await createQueueForTransaction(transaction.id, tableNumber)
      isSubmitting.value = false
      paymentDialogOpen.value = false
      paymentWithQueue.value = false
      pendingTableNumber.value = null

      if (!queue) {
        resetForm()
        await loadData()
        return
      }

      const methodLabel = method === 'qris' ? 'QRIS' : method === 'cash' ? 'Cash' : 'Transfer'
      alertStore.showAlert(
        'Berhasil',
        queueSuccessMessage(queue.queue_number, tableNumber, `Transaksi lunas (${methodLabel}) & antrian`),
        'success',
      )
    } else {
      isSubmitting.value = false
      paymentDialogOpen.value = false
      paymentWithQueue.value = false
      pendingTableNumber.value = null

      const methodLabel = method === 'qris' ? 'QRIS' : method === 'cash' ? 'Cash' : 'Transfer'
      alertStore.showAlert('Berhasil', `Transaksi lunas (${methodLabel}) berhasil dibuat`, 'success')
    }

    resetForm()
    await loadData()
  }

  onMounted(loadData)

  return {
    customers,
    selectedCustomerId,
    selectedCustomer,
    requiresImmediatePayment,
    notes,
    selectedProductId,
    selectedProduct,
    availableProducts,
    addQuantity,
    cart,
    pendingTransaction,
    isLoading,
    isSubmitting,
    paymentDialogOpen,
    tableDialogOpen,
    addonDialogOpen,
    pendingProduct,
    pendingProductAddons,
    totalAmount,
    formatPrice,
    getCartLineSubtotal,
    handleAddSelectedProduct,
    handleAddonConfirm,
    updateQuantity,
    removeFromCart,
    handleSubmit,
    openQueueFlow,
    handleTableNumberConfirm,
    openPaymentDialog,
    handlePayment,
  }
}
