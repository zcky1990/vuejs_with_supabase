  <script setup lang="ts">
import { ChevronDownIcon, MoreHorizontal } from '@lucide/vue'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Input } from '@/components/ui/input'
import { computed} from 'vue'

const props = defineProps<{
  searchInOptions?: { label: string, value: string }[]
  searchQuery?: string
  selectedOption?: { label: string, value: string } | null
}>()

const options = computed(() => {
  return props.searchInOptions || []
})

const selectedOption = computed(() => {
  return props.selectedOption || null
})

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'update:selectedOption', value: { label: string, value: string } | null): void
}>()

const queryModel = computed({
  get: () => props.searchQuery,
  set: (value) => {
    emit('update:searchQuery', value)
  },
})

const handleOptionSelect = (option: { label: string, value: string }) => {
  selectedOption.value = option
  emit('update:selectedOption', option)
}
</script>

<template>
  <div class="grid w-full max-w-sm gap-4">
    <InputGroup class="[--radius:1rem] bg-background min-w-48">
      <InputGroupInput v-model="queryModel" placeholder="Enter search query" class="min-w-48 w-full" />
      <InputGroupAddon align="inline-end">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <InputGroupButton variant="ghost" class="!pr-1.5 text-xs">
              {{ selectedOption?.label || 'Search In...' }} <ChevronDownIcon class="size-3" />
            </InputGroupButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="[--radius:0.95rem]">
            <DropdownMenuItem v-for="option in options" :key="option.value" @click="handleOptionSelect(option)">
              {{ option.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </InputGroupAddon>
    </InputGroup>
  </div>
</template>