<script setup lang="ts">
import { ChevronDown, Search } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'
import { computed, ref } from 'vue'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/composables/useI18n'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/database'

const props = withDefaults(
  defineProps<{
    products: Product[]
    placeholder?: string
    disabled?: boolean
    id?: string
  }>(),
  {
    placeholder: undefined,
    disabled: false,
    id: undefined,
  },
)

const modelValue = defineModel<string>({ required: true })

const { t } = useI18n()

const containerRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const searchQuery = ref('')

const selectedProduct = computed(() =>
  props.products.find((product) => product.id === modelValue.value) ?? null,
)

const displayProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    return props.products
  }

  return props.products.filter((product) => {
    const name = product.name.toLowerCase()
    const sku = product.sku?.toLowerCase() ?? ''
    const category = product.product_categories?.name.toLowerCase() ?? ''
    return name.includes(query) || sku.includes(query) || category.includes(query)
  })
})

const inputValue = computed({
  get() {
    if (isOpen.value) {
      return searchQuery.value
    }

    if (selectedProduct.value) {
      return productLabel(selectedProduct.value)
    }

    return ''
  },
  set(value: string | number) {
    searchQuery.value = String(value)
    isOpen.value = true
  },
})

function productLabel(product: Product) {
  return `${product.name} · ${formatPrice(product.price)} · ${t('common.stockLabel', { quantity: product.stock_quantity })}`
}

function openSearch() {
  if (props.disabled) {
    return
  }

  isOpen.value = true
  searchQuery.value = selectedProduct.value?.name ?? ''
}

function closeSearch() {
  isOpen.value = false
  searchQuery.value = ''
}

function selectProduct(product: Product) {
  modelValue.value = product.id
  closeSearch()
}

function onInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeSearch()
    return
  }

  if (event.key === 'Enter' && displayProducts.value.length === 1) {
    event.preventDefault()
    selectProduct(displayProducts.value[0]!)
  }
}

onClickOutside(containerRef, closeSearch)
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <div class="relative">
      <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        :id="id"
        v-model="inputValue"
        :placeholder="placeholder ?? t('master.searchProduct')"
        :disabled="disabled"
        class="pr-9 pl-9"
        autocomplete="off"
        role="combobox"
        :aria-expanded="isOpen"
        aria-autocomplete="list"
        @focus="openSearch"
        @keydown="onInputKeydown"
      />
      <ChevronDown
        class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>

    <div
      v-if="isOpen"
      class="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border shadow-md"
    >
      <ul role="listbox" class="p-1">
        <li
          v-for="product in displayProducts"
          :key="product.id"
          role="option"
          :aria-selected="product.id === modelValue"
          class="cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
          :class="cn(product.id === modelValue && 'bg-accent text-accent-foreground')"
          @mousedown.prevent="selectProduct(product)"
        >
          {{ productLabel(product) }}
        </li>
        <li
          v-if="!displayProducts.length"
          class="px-2 py-1.5 text-sm text-muted-foreground"
        >
          {{ t('common.noResults') }}
        </li>
      </ul>
    </div>
  </div>
</template>
