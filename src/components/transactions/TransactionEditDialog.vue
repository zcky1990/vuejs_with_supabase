<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Minus, Plus, Trash2 } from '@lucide/vue'
import AddonSelectDialog from '@/components/transactions/AddonSelectDialog.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  buildCartLineKey,
  cartAddonsToInput,
  getLineSubtotal,
  hasBundleAddons,
  type CartAddonSelection,
} from '@/lib/addon'
import { formatPrice } from '@/lib/format'
import { getProducts, getProductAddonsMap } from '@/lib/product'
import { updateTransactionItems } from '@/lib/transaction'
import { useAlertStore } from '@/stores/useAlertStore'
import type { Product, TransactionWithDetails } from '@/types/database'

type EditableItem = {
  id: string
  product_id: string
  name: string
  quantity: number
  unit_price: number
  isNew: boolean
  addons: CartAddonSelection[]
}

const props = defineProps<{
  open: boolean
  transaction: TransactionWithDetails | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const alertStore = useAlertStore()
const notes = ref('')
const items = ref<EditableItem[]>([])
const products = ref<Product[]>([])
const productAddonsMap = ref<Record<string, Product[]>>({})
const selectedProductId = ref('')
const addQuantity = ref(1)
const addonDialogOpen = ref(false)
const pendingProduct = ref<Product | null>(null)
const pendingQuantity = ref(1)
const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})

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
  items.value.reduce(
    (sum, item) => sum + getLineSubtotal(item.quantity, item.unit_price, cartAddonsToInput(item.addons)),
    0,
  ),
)

function getItemLineKey(item: EditableItem) {
  return buildCartLineKey(item.product_id, item.addons)
}

function getItemSubtotal(item: EditableItem) {
  return getLineSubtotal(item.quantity, item.unit_price, cartAddonsToInput(item.addons))
}

function hasEnoughStock(product: Product, addons: CartAddonSelection[], menuQuantity: number) {
  if (menuQuantity > product.stock_quantity) return false

  for (const addon of addons) {
    const required = addon.quantity * menuQuantity
    if (required > addon.product.stock_quantity) return false
  }

  return true
}

async function loadProducts() {
  const [productResult, addonMapResult] = await Promise.all([
    getProducts(),
    getProductAddonsMap(),
  ])

  if (productResult.error) {
    alertStore.showAlert('Error', productResult.error.message, 'error')
    return
  }

  products.value = (productResult.products ?? []).filter((product) => product.is_active)
  productAddonsMap.value = addonMapResult.map ?? {}
}

function resetForm() {
  errors.value = {}
  selectedProductId.value = ''
  addQuantity.value = 1
  pendingProduct.value = null
  pendingQuantity.value = 1

  if (!props.transaction) {
    notes.value = ''
    items.value = []
    return
  }

  notes.value = props.transaction.notes ?? ''
  items.value = props.transaction.transaction_items.flatMap((item) => {
    const addons = (item.transaction_item_addons ?? [])
      .map((addon) => {
        const product = products.value.find((entry) => entry.id === addon.addon_product_id)
        if (!product) return null
        return { product, quantity: addon.quantity }
      })
      .filter((addon): addon is CartAddonSelection => addon !== null)

    const base = {
      product_id: item.product_id ?? item.products?.id ?? '',
      name: item.products?.name ?? 'Produk',
      unit_price: Number(item.unit_price),
      addons,
    }

    if (!hasBundleAddons(addons) || item.quantity <= 1) {
      return [{
        id: item.id,
        ...base,
        quantity: item.quantity,
        isNew: false,
      }]
    }

    return Array.from({ length: item.quantity }, (_, index) => ({
      id: index === 0 ? item.id : `new-${crypto.randomUUID()}`,
      ...base,
      quantity: 1,
      isNew: index > 0,
    }))
  })
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    await loadProducts()
    resetForm()
  },
)

function addItem(product: Product, quantity: number, addons: CartAddonSelection[] = []) {
  if (hasBundleAddons(addons)) {
    for (let i = 0; i < quantity; i++) {
      if (!hasEnoughStock(product, addons, 1)) {
        alertStore.showAlert('Stok tidak cukup', 'Stok menu atau addon tidak mencukupi', 'error')
        return
      }

      items.value.push({
        id: `new-${crypto.randomUUID()}`,
        product_id: product.id,
        name: product.name,
        quantity: 1,
        unit_price: product.price,
        isNew: true,
        addons,
      })
    }
    return
  }

  const lineKey = buildCartLineKey(product.id, addons)
  const existing = items.value.find((entry) => getItemLineKey(entry) === lineKey)

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

  items.value.push({
    id: `new-${crypto.randomUUID()}`,
    product_id: product.id,
    name: product.name,
    quantity,
    unit_price: product.price,
    isNew: true,
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

  addItem(selectedProduct.value, addQuantity.value)
  selectedProductId.value = ''
  addQuantity.value = 1
}

function handleAddonConfirm(addons: CartAddonSelection[]) {
  if (!pendingProduct.value) return

  addItem(pendingProduct.value, pendingQuantity.value, addons)
  pendingProduct.value = null
  pendingQuantity.value = 1
  selectedProductId.value = ''
  addQuantity.value = 1
}

function updateQuantity(itemId: string, quantity: number) {
  const item = items.value.find((entry) => entry.id === itemId)
  if (!item) return

  const product = products.value.find((entry) => entry.id === item.product_id)

  if (hasBundleAddons(item.addons)) {
    if (quantity <= item.quantity) {
      removeItem(itemId)
      return
    }

    if (product && !hasEnoughStock(product, item.addons, 1)) {
      alertStore.showAlert('Stok tidak cukup', 'Stok menu atau addon tidak mencukupi', 'error')
      return
    }

    items.value.push({
      id: `new-${crypto.randomUUID()}`,
      product_id: item.product_id,
      name: item.name,
      quantity: 1,
      unit_price: item.unit_price,
      isNew: true,
      addons: item.addons,
    })
    return
  }

  const nextQuantity = Math.max(1, Math.floor(quantity) || 1)

  if (product && !hasEnoughStock(product, item.addons, nextQuantity)) {
    alertStore.showAlert('Stok tidak cukup', 'Stok menu atau addon tidak mencukupi', 'error')
    return
  }

  item.quantity = nextQuantity
}

function removeItem(itemId: string) {
  if (items.value.length <= 1) {
    alertStore.showAlert('Perhatian', 'Transaksi harus memiliki minimal 1 item', 'error')
    return
  }

  items.value = items.value.filter((entry) => entry.id !== itemId)
}

function setFieldErrors(fieldErrors: Record<string, string[] | undefined>) {
  errors.value = Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(([, messages]) => messages?.length)
      .map(([field, messages]) => [field, messages![0]!]),
  )
}

async function handleSave() {
  if (!props.transaction) return

  if (!items.value.length) {
    alertStore.showAlert('Perhatian', 'Transaksi harus memiliki minimal 1 item', 'error')
    return
  }

  isSubmitting.value = true
  const { error } = await updateTransactionItems(props.transaction.id, {
    notes: notes.value || null,
    items: items.value.map((item) => {
      if (item.isNew) {
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          addons: item.addons.length ? cartAddonsToInput(item.addons) : undefined,
        }
      }

      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
      }
    }),
  })
  isSubmitting.value = false

  if (error) {
    if (typeof error === 'object' && 'message' in error) {
      alertStore.showAlert('Error', String(error.message), 'error')
      return
    }

    setFieldErrors(error as Record<string, string[] | undefined>)
    return
  }

  alertStore.showAlert('Berhasil', 'Transaksi berhasil diperbarui', 'success')
  emit('update:open', false)
  emit('saved')
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>Perbaiki Transaksi</DialogTitle>
        <DialogDescription v-if="transaction">
          Ubah jumlah item, tambah produk baru, atau ubah catatan transaksi.
        </DialogDescription>
      </DialogHeader>

      <div v-if="transaction" class="space-y-4">
        <div class="space-y-3">
          <p class="text-sm font-medium">Produk</p>
          <div
            v-for="item in items"
            :key="item.id"
            class="rounded-xl border px-4 py-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-medium">
                  {{ item.name }}
                  <span
                    v-if="item.isNew"
                    class="ml-1 text-xs font-normal text-primary"
                  >(baru)</span>
                  <span v-if="!hasBundleAddons(item.addons)" class="text-muted-foreground">
                    x{{ item.quantity }}
                  </span>
                </p>
                <p class="text-sm text-muted-foreground">
                  {{ formatPrice(item.unit_price) }}
                  <span v-if="!hasBundleAddons(item.addons)"> / item</span>
                </p>
                <ul
                  v-if="item.addons.length"
                  class="mt-1 space-y-0.5 text-xs text-muted-foreground"
                >
                  <li
                    v-for="addon in item.addons"
                    :key="addon.product.id"
                  >
                    + {{ addon.product.name }}
                    <span v-if="addon.quantity > 1">x{{ addon.quantity }}</span>
                    ({{ formatPrice(addon.product.price * addon.quantity) }})
                  </li>
                </ul>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                :disabled="items.length <= 1"
                @click="removeItem(item.id)"
              >
                <Trash2 class="size-4" />
              </Button>
            </div>

            <div class="mt-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Button
                  size="icon-sm"
                  variant="outline"
                  @click="updateQuantity(item.id, item.quantity - 1)"
                >
                  <Minus class="size-4" />
                </Button>
                <Input
                  v-if="!hasBundleAddons(item.addons)"
                  :model-value="item.quantity"
                  type="number"
                  min="1"
                  class="w-16 text-center"
                  @update:model-value="updateQuantity(item.id, Number($event))"
                />
                <span
                  v-else
                  class="min-w-6 text-center text-sm font-medium tabular-nums"
                >
                  1
                </span>
                <Button
                  size="icon-sm"
                  variant="outline"
                  @click="updateQuantity(item.id, item.quantity + 1)"
                >
                  <Plus class="size-4" />
                </Button>
              </div>
              <p class="font-semibold">
                {{ formatPrice(getItemSubtotal(item)) }}
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-xl border bg-muted/30 p-4">
          <p class="mb-3 text-sm font-medium">Tambah Produk</p>
          <FieldGroup>
            <Field>
              <FieldLabel>Produk</FieldLabel>
              <Select v-model="selectedProductId">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="product in availableProducts"
                    :key="product.id"
                    :value="product.id"
                  >
                    {{ product.name }} · {{ formatPrice(product.price) }} · Stok {{ product.stock_quantity }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div class="flex items-end gap-3">
              <Field class="flex-1">
                <FieldLabel for="edit-add-quantity">Jumlah</FieldLabel>
                <Input
                  id="edit-add-quantity"
                  v-model.number="addQuantity"
                  type="number"
                  min="1"
                  :max="selectedProduct?.stock_quantity ?? undefined"
                />
              </Field>
              <Button
                class="shrink-0"
                variant="secondary"
                :disabled="!availableProducts.length"
                @click="handleAddSelectedProduct"
              >
                <Plus class="size-4" />
                Tambah
              </Button>
            </div>
          </FieldGroup>
        </div>

        <Field>
          <FieldLabel for="edit-notes">Catatan</FieldLabel>
          <Textarea
            id="edit-notes"
            v-model="notes"
            placeholder="Catatan transaksi"
            rows="3"
          />
        </Field>

        <div class="flex items-center justify-between border-t pt-4">
          <span class="text-sm text-muted-foreground">Total</span>
          <span class="text-lg font-bold">{{ formatPrice(totalAmount) }}</span>
        </div>

        <p v-if="errors.items" class="text-sm text-destructive">{{ errors.items }}</p>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="outline">Batal</Button>
        </DialogClose>
        <Button :disabled="isSubmitting" @click="handleSave">
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
        </Button>
      </DialogFooter>
    </DialogContent>

    <AddonSelectDialog
      v-model:open="addonDialogOpen"
      :product="pendingProduct"
      :addons="pendingProductAddons"
      @confirm="handleAddonConfirm"
    />
  </Dialog>
</template>
