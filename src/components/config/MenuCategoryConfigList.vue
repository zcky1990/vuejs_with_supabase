<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown, ChevronUp } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/composables/useI18n'
import type { ProductCategory } from '@/types/database'

const props = defineProps<{
  categories: ProductCategory[]
  selectedIds: string[]
}>()

const emit = defineEmits<{
  'update:selectedIds': [value: string[]]
}>()

const { t } = useI18n()

const selectedSet = computed(() => new Set(props.selectedIds))

const orderedSelected = computed(() =>
  props.selectedIds
    .map((id) => props.categories.find((category) => category.id === id))
    .filter((category): category is ProductCategory => category !== undefined),
)

const unselectedCategories = computed(() =>
  props.categories.filter((category) => !selectedSet.value.has(category.id)),
)

function toggleCategory(categoryId: string, checked: boolean) {
  if (checked) {
    emit('update:selectedIds', [...props.selectedIds, categoryId])
    return
  }

  emit('update:selectedIds', props.selectedIds.filter((id) => id !== categoryId))
}

function moveCategory(categoryId: string, direction: -1 | 1) {
  const index = props.selectedIds.indexOf(categoryId)
  if (index < 0) return

  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= props.selectedIds.length) return

  const next = [...props.selectedIds]
  const [item] = next.splice(index, 1)
  next.splice(nextIndex, 0, item!)
  emit('update:selectedIds', next)
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="!categories.length" class="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      {{ t('config.menuCategoryEmpty') }}
    </div>

    <div v-else class="space-y-4">
      <div v-if="orderedSelected.length" class="space-y-2">
        <p class="text-sm font-medium">{{ t('config.menuCategoryOrder') }}</p>
        <div
          v-for="(category, index) in orderedSelected"
          :key="category.id"
          class="flex items-center gap-3 rounded-lg border px-3 py-2"
        >
          <span class="min-w-6 text-sm font-medium text-muted-foreground tabular-nums">
            {{ index + 1 }}
          </span>
          <p class="min-w-0 flex-1 text-sm font-medium">{{ category.name }}</p>
          <div class="flex shrink-0 gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              :disabled="index === 0"
              @click="moveCategory(category.id, -1)"
            >
              <ChevronUp class="size-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              :disabled="index === orderedSelected.length - 1"
              @click="moveCategory(category.id, 1)"
            >
              <ChevronDown class="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium">{{ t('config.menuCategoryAvailable') }}</p>
        <div class="space-y-2">
          <label
            v-for="category in categories"
            :key="category.id"
            class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2"
          >
            <input
              type="checkbox"
              class="size-4 rounded border-input"
              :checked="selectedSet.has(category.id)"
              @change="toggleCategory(category.id, ($event.target as HTMLInputElement).checked)"
            >
            <span class="text-sm">{{ category.name }}</span>
          </label>
        </div>
      </div>

      <p v-if="unselectedCategories.length && orderedSelected.length" class="text-xs text-muted-foreground">
        {{ t('config.menuCategoryUncheckedHint') }}
      </p>
    </div>
  </div>
</template>
