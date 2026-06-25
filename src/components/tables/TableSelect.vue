<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/composables/useI18n'
import { getDiningTablesWithAvailability } from '@/lib/table'
import type { DiningTableWithAvailability, TableAvailabilityStatus } from '@/types/database'

const props = withDefaults(
  defineProps<{
    onlyAvailable?: boolean
    placeholder?: string
    disabled?: boolean
    id?: string
  }>(),
  {
    onlyAvailable: true,
    placeholder: undefined,
    disabled: false,
    id: undefined,
  },
)

const modelValue = defineModel<string>({ required: true })

const { t } = useI18n()
const tables = ref<DiningTableWithAvailability[]>([])
const isLoading = ref(true)

const availabilityLabel: Record<TableAvailabilityStatus, string> = {
  available: 'master.availabilityAvailable',
  occupied: 'master.availabilityOccupied',
  reserved: 'master.availabilityReserved',
  inactive: 'master.availabilityInactive',
}

const displayTables = computed(() => {
  if (props.onlyAvailable) {
    return tables.value.filter((table) => table.availability_status === 'available')
  }

  return tables.value
})

function tableOptionLabel(table: DiningTableWithAvailability) {
  const statusKey = availabilityLabel[table.availability_status]
  const status = t(statusKey)
  return `${t('order.table', { number: table.table_number })} · ${t('master.diningTableSeatsCount', { count: table.seats })} · ${status}`
}

function isOptionDisabled(table: DiningTableWithAvailability) {
  return table.availability_status !== 'available'
}

onMounted(async () => {
  isLoading.value = true
  const { tables: data } = await getDiningTablesWithAvailability()
  tables.value = data ?? []
  isLoading.value = false
})
</script>

<template>
  <Select
    :model-value="modelValue"
    :disabled="disabled || isLoading || (!displayTables.length && onlyAvailable)"
    @update:model-value="modelValue = String($event ?? '')"
  >
    <SelectTrigger :id="id" class="w-full">
      <SelectValue :placeholder="placeholder ?? t('master.selectDiningTable')" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem
        v-for="table in displayTables"
        :key="table.id"
        :value="table.table_number"
        :disabled="!onlyAvailable && isOptionDisabled(table)"
      >
        {{ tableOptionLabel(table) }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
