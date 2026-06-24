<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { formatPrice } from '@/lib/format'
import type { PaymentBreakdownRow } from '@/types/database'

const props = defineProps<{
  rows: PaymentBreakdownRow[]
  showTotal?: boolean
}>()

const { t } = useI18n()

const totalAmount = computed(() =>
  props.rows.reduce((sum, row) => sum + row.amount, 0),
)

const totalCount = computed(() =>
  props.rows.reduce((sum, row) => sum + row.transactionCount, 0),
)
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <div
      v-for="row in rows"
      :key="row.method"
      class="rounded-lg border p-4"
    >
      <p class="text-xs text-muted-foreground">{{ row.label }}</p>
      <p class="mt-1 text-lg font-semibold">{{ formatPrice(row.amount) }}</p>
      <p class="text-xs text-muted-foreground">
        {{ t('shift.transactionCount', { count: row.transactionCount }) }}
      </p>
    </div>
    <div
      v-if="showTotal !== false"
      class="rounded-lg border bg-muted/30 p-4 sm:col-span-2 lg:col-span-1"
    >
      <p class="text-xs text-muted-foreground">{{ t('transaction.fundTotal') }}</p>
      <p class="mt-1 text-lg font-semibold">{{ formatPrice(totalAmount) }}</p>
      <p class="text-xs text-muted-foreground">
        {{ t('shift.transactionCount', { count: totalCount }) }}
      </p>
    </div>
  </div>
</template>
