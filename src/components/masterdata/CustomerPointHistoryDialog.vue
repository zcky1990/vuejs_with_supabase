<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useI18n } from '@/composables/useI18n'
import { formatShopDateTime } from '@/lib/date'
import { getCustomerPointLedger } from '@/lib/loyalty'
import type { Customer, CustomerPointLedgerEntry, CustomerPointLedgerEntryType } from '@/types/database'

const props = defineProps<{
  open: boolean
  customer: Customer | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()
const entries = ref<CustomerPointLedgerEntry[]>([])
const isLoading = ref(false)

const entryTypeLabel = computed(() => ({
  earn: t('loyalty.entryEarn'),
  redeem: t('loyalty.entryRedeem'),
  reverse_earn: t('loyalty.entryReverseEarn'),
  reverse_redeem: t('loyalty.entryReverseRedeem'),
  adjust: t('loyalty.entryAdjust'),
} satisfies Record<CustomerPointLedgerEntryType, string>))

async function loadHistory() {
  if (!props.customer) return

  isLoading.value = true
  const { entries: data, error } = await getCustomerPointLedger(props.customer.id)
  isLoading.value = false

  if (!error) {
    entries.value = data ?? []
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      loadHistory()
    }
  },
)
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[640px]">
      <DialogHeader>
        <DialogTitle>{{ t('loyalty.historyTitle') }}</DialogTitle>
        <DialogDescription>
          {{ customer?.name }} · {{ customer?.loyalty_points ?? 0 }} {{ t('loyalty.points') }}
        </DialogDescription>
      </DialogHeader>

      <div class="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t('common.date') }}</TableHead>
              <TableHead>{{ t('common.type') }}</TableHead>
              <TableHead class="text-right">{{ t('loyalty.points') }}</TableHead>
              <TableHead class="text-right">{{ t('loyalty.pointsBalance') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading">
              <TableCell colspan="4" class="text-center text-muted-foreground">
                {{ t('common.loading') }}
              </TableCell>
            </TableRow>
            <TableRow v-else-if="!entries.length">
              <TableCell colspan="4" class="text-center text-muted-foreground">
                {{ t('loyalty.historyEmpty') }}
              </TableCell>
            </TableRow>
            <TableRow v-for="entry in entries" :key="entry.id">
              <TableCell>{{ formatShopDateTime(entry.created_at) }}</TableCell>
              <TableCell>{{ entryTypeLabel[entry.entry_type] }}</TableCell>
              <TableCell class="text-right font-medium">
                {{ entry.points_delta > 0 ? `+${entry.points_delta}` : entry.points_delta }}
              </TableCell>
              <TableCell class="text-right">{{ entry.balance_after }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div class="flex justify-end">
        <Button variant="outline" @click="emit('update:open', false)">
          {{ t('common.close') }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
