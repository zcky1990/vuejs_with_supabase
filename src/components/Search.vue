<script setup lang="ts">
import Search from '@/components/search/Search.vue'
import ProductList from '@/components/ProductList.vue'
import CustomerList from '@/components/CustomerList.vue'
import { Button } from '@/components/ui/button'
import { ref, computed } from 'vue'
import { getProductByName } from '@/lib/product'
import { getCustomerByName } from '@/lib/customer'
import { useAlertStore } from '@/stores/useAlertStore'
import { useThemeStore } from '@/stores/useThemeStore'
import TextType from '@/components/ui/text-type/TextType.vue'
import type { Customer, Product } from '@/types/database'

const searchQuery = ref<string>('')
const selectedOption = ref<{ label: string, value: string } | null>(null)
const searchInOptions = ref<{ label: string, value: string }[]>([
  { label: 'Pembeli', value: 'customers' },
  { label: 'Produk', value: 'product' },
])

const alertStore = useAlertStore()
const themeStore = useThemeStore()

const theme = computed(() => {
  return themeStore.themeState
})

const searchResults = ref<(Product | Customer)[]>([])
const resultType = ref<'product' | 'customers' | null>(null)

const productResults = computed(() =>
  resultType.value === 'product' ? (searchResults.value as Product[]) : [],
)

const customerResults = computed(() =>
  resultType.value === 'customers' ? (searchResults.value as Customer[]) : [],
)

const handleSearchQueryUpdate = (value: string) => {
  searchQuery.value = value
}

const handleSelectedOptionUpdate = (option: { label: string, value: string } | null) => {
  selectedOption.value = option
}

const handleSearch = async () => {
  const query = searchQuery.value.trim()

  if (!query) {
    alertStore.showAlert('Error', 'Masukkan kata kunci pencarian', 'error')
    return
  }

  if (!selectedOption.value) {
    alertStore.showAlert('Error', 'Pilih kategori pencarian', 'error')
    return
  }

  searchResults.value = []
  resultType.value = null

  if (selectedOption.value.value === 'product') {
    const { products: data, error } = await getProductByName(query)
    if (error) {
      alertStore.showAlert('Error', error.message, 'error')
      return
    }

    searchResults.value = data || []
    resultType.value = 'product'

    if (!searchResults.value.length) {
      alertStore.showAlert('Tidak ditemukan', `Produk "${query}" tidak ditemukan`, 'error')
    }
    return
  }

  if (selectedOption.value.value === 'customers') {
    const { customers: data, error } = await getCustomerByName(query)
    if (error) {
      alertStore.showAlert('Error', error.message, 'error')
      return
    }

    searchResults.value = data || []
    resultType.value = 'customers'

    if (!searchResults.value.length) {
      alertStore.showAlert('Tidak ditemukan', `Pembeli "${query}" tidak ditemukan`, 'error')
    }
  }
}

const textColor = computed(() => {
  const rootStyles = getComputedStyle(document.documentElement);
  return rootStyles.getPropertyValue('--color-text').trim()
})

</script>

<template>
  <div class="flex flex-col gap-4 items-center justify-center h-screen container mx-auto">
    <TextType 
    :text="['Selamat Datang', 'Warung Zavi']"
    :typing-speed="75"
    :pause-duration="1500"
    :show-cursor="true"
    :text-colors="[textColor]"
    className="max-w-4xl text-foreground sm:text-3xl md:text-4xl lg:text-4xl"
    cursor-character="|"
  />
    <div class="flex flex-col z-2 gap-4 items-center justify-center">
    <Search :searchInOptions="searchInOptions" 
      :searchQuery="searchQuery" 
      :selectedOption="selectedOption" 
      @update:searchQuery="handleSearchQueryUpdate" 
      @update:selectedOption="handleSelectedOptionUpdate" />
    <Button @click="handleSearch" class="rounded-full py-2 px-4 bg-primary text-primary-foreground">Search</Button>

    <ProductList
      v-if="resultType === 'product' && productResults.length"
      :products="productResults"
    />
    <CustomerList
      v-if="resultType === 'customers' && customerResults.length"
      :customers="customerResults"
    />
  </div>
  </div>
</template>
