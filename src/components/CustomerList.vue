<script setup lang="ts">
import type { Customer } from '@/types/database'

defineProps<{
  customers: Customer[]
}>()

function getCustomerDetail(customer: Customer) {
  return customer.address || customer.phone || customer.email || 'Tidak ada detail'
}
</script>

<template>
  <div class="w-full max-w-sm space-y-2">
    <div
      v-for="customer in customers"
      :key="customer.id"
      class="rounded-xl border border-border bg-background/90 px-4 py-3 backdrop-blur-sm"
    >
      <p class="font-semibold text-foreground">
        {{ customer.name }}
      </p>
      <p class="text-sm text-muted-foreground">
        {{ getCustomerDetail(customer) }}
      </p>
    </div>
  </div>
</template>
