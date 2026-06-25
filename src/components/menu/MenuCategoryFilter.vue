<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useI18n } from '@/composables/useI18n'
import type { MenuCategoryOption } from '@/lib/menu-categories'

defineProps<{
  categories: MenuCategoryOption[]
  categoryFilter: string
}>()

const { t } = useI18n()

const emit = defineEmits<{
  'update:categoryFilter': [value: string]
}>()
</script>

<template>
  <div class="flex gap-2 overflow-x-auto pb-1">
    <Button
      size="sm"
      :variant="categoryFilter === 'all' ? 'default' : 'outline'"
      class="shrink-0 rounded-full"
      @click="emit('update:categoryFilter', 'all')"
    >
      {{ t('common.all') }}
    </Button>
    <Button
      v-for="category in categories"
      :key="category.id"
      size="sm"
      :variant="categoryFilter === category.id ? 'default' : 'outline'"
      class="shrink-0 rounded-full"
      @click="emit('update:categoryFilter', category.id)"
    >
      {{ category.name }}
    </Button>
  </div>
</template>
