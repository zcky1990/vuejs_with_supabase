<script setup lang="ts">
import { Plus } from '@lucide/vue'
import MenuCategoryFilter from '@/components/menu/MenuCategoryFilter.vue'
import ProductSearchSelect from '@/components/products/ProductSearchSelect.vue'
import TableSelect from '@/components/tables/TableSelect.vue'
import { Button } from '@/components/ui/button'
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
import { useI18n } from '@/composables/useI18n'
import { formatPrice } from '@/lib/format'
import type { MenuCategoryOption } from '@/lib/menu-categories'
import type { Customer, Product } from '@/types/database'
import { WALK_IN_CUSTOMER_NAME } from '@/types/database'

defineProps<{
  customers: Customer[]
  selectedCustomer: Customer | null
  requiresImmediatePayment?: boolean
  allowEatFirst?: boolean
  requireTableForEatFirst?: boolean
  menuCategories: MenuCategoryOption[]
  filteredProducts: Product[]
  selectedProduct: Product | null
}>()

const categoryFilterModel = defineModel<string>('categoryFilter', { required: true })

const { t } = useI18n()

const selectedCustomerId = defineModel<string>('selectedCustomerId', { required: true })
const notes = defineModel<string>('notes', { required: true })
const tableNumber = defineModel<string>('tableNumber', { required: false, default: '' })
const selectedProductId = defineModel<string>('selectedProductId', { required: true })
const addQuantity = defineModel<number>('addQuantity', { required: true })

const emit = defineEmits<{
  addProduct: []
}>()

function displayCustomerName(name: string) {
  if (name === WALK_IN_CUSTOMER_NAME) return `${t('common.walkIn')}${t('common.defaultSuffix')}`
  return name
}
</script>

<template>
  <section class="space-y-4">
    <div class="rounded-xl border bg-background p-4">
      <FieldGroup>
        <Field>
          <FieldLabel for="customer">{{ t('transaction.buyerLabel') }}</FieldLabel>
          <Select v-model="selectedCustomerId">
            <SelectTrigger id="customer" class="w-full">
              <SelectValue :placeholder="t('transaction.buyerLabel')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="customer in customers"
                :key="customer.id"
                :value="customer.id"
              >
                {{ displayCustomerName(customer.name) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="selectedCustomer" class="text-sm text-muted-foreground">
            {{ selectedCustomer.phone || selectedCustomer.email || selectedCustomer.address || t('common.noContact') }}
          </p>
          <p
            v-if="selectedCustomer?.is_member"
            class="text-sm font-medium text-primary"
          >
            {{ t('loyalty.member') }} · {{ selectedCustomer.loyalty_points }} {{ t('loyalty.points') }}
          </p>
          <p
            v-if="requiresImmediatePayment && allowEatFirst"
            class="text-sm text-amber-600 dark:text-amber-400"
          >
            {{ t('transaction.tableRequired') }}
          </p>
        </Field>

        <Field v-if="allowEatFirst">
          <FieldLabel for="table-number">{{ t('common.table') }}</FieldLabel>
          <TableSelect
            id="table-number"
            v-model="tableNumber"
            :placeholder="requireTableForEatFirst ? t('master.selectDiningTable') : t('common.optional')"
          />
        </Field>

        <Field>
          <FieldLabel for="notes">{{ t('common.notes') }}</FieldLabel>
          <Textarea
            id="notes"
            v-model="notes"
            :placeholder="t('transaction.notesPlaceholder')"
            rows="2"
          />
        </Field>
      </FieldGroup>
    </div>

    <div class="rounded-xl border bg-background space-y-4 p-4">
      <MenuCategoryFilter
        v-if="menuCategories.length"
        :categories="menuCategories"
        :category-filter="categoryFilterModel"
        @update:category-filter="categoryFilterModel = $event"
      />

      <FieldGroup>
        <Field>
          <FieldLabel for="transaction-product">{{ t('common.product') }}</FieldLabel>
          <ProductSearchSelect
            id="transaction-product"
            v-model="selectedProductId"
            :products="filteredProducts"
            :placeholder="t('master.searchProduct')"
            :disabled="!filteredProducts.length"
          />
          <p v-if="selectedProduct" class="text-sm text-muted-foreground">
            {{ formatPrice(selectedProduct.price) }} · {{ t('common.stockAvailable', { quantity: selectedProduct.stock_quantity }) }}
          </p>
          <p v-else-if="!filteredProducts.length" class="text-sm text-muted-foreground">
            {{ t('transaction.noProducts') }}
          </p>
        </Field>

        <div class="flex items-end gap-3">
          <Field class="flex-1">
            <FieldLabel for="add-quantity">{{ t('common.quantity') }}</FieldLabel>
            <Input
              id="add-quantity"
              v-model.number="addQuantity"
              type="number"
              min="1"
              :max="selectedProduct?.stock_quantity ?? undefined"
            />
          </Field>
          <Button
            class="shrink-0"
            :disabled="!filteredProducts.length"
            @click="emit('addProduct')"
          >
            <Plus class="size-4" />
            {{ t('common.add') }}
          </Button>
        </div>
      </FieldGroup>
    </div>
  </section>
</template>
