<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PaymentMethodDialog from '@/components/transactions/PaymentMethodDialog.vue'
import PaymentSuccessDialog from '@/components/transactions/PaymentSuccessDialog.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { formatPreOrderItemWithAddons } from '@/lib/addon'
import { formatPrice } from '@/lib/format'
import { buildInvoiceFromTransaction, type InvoiceData } from '@/lib/invoice'
import { formatPreOrderNumber, getPreOrderPaymentLabel, processPreOrder } from '@/lib/pre-order'
import { getTransactionById } from '@/lib/transaction'
import { useAlertStore } from '@/stores/useAlertStore'
import type { PaymentMethod, PreOrderWithDetails } from '@/types/database'

const props = defineProps<{
  open: boolean
  preOrder: PreOrderWithDetails | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  processed: []
}>()

const alertStore = useAlertStore()
const addToQueue = ref(true)
const tableNumber = ref('')
const isSubmitting = ref(false)
const paymentDialogOpen = ref(false)
const paymentSuccessDialogOpen = ref(false)
const paymentSuccessInvoice = ref<InvoiceData | null>(null)

const items = computed(() => props.preOrder?.pre_order_items ?? [])

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    addToQueue.value = true
    tableNumber.value = props.preOrder?.table_number ?? ''
  },
)

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message)
  }

  return 'Gagal memproses pesanan'
}

async function handlePayment(method: PaymentMethod) {
  if (!props.preOrder) return

  isSubmitting.value = true
  const { transaction, queueNumber, error } = await processPreOrder(props.preOrder.id, {
    paymentMethod: method,
    addToQueue: addToQueue.value,
    tableNumber: tableNumber.value.trim() || null,
  })
  isSubmitting.value = false
  paymentDialogOpen.value = false

  if (error) {
    alertStore.showAlert('Error', getErrorMessage(error), 'error')
    return
  }

  if (!transaction) {
    alertStore.showAlert('Error', 'Transaksi tidak ditemukan', 'error')
    return
  }

  const { transaction: transactionDetails, error: fetchError } = await getTransactionById(transaction.id)

  if (fetchError || !transactionDetails) {
    alertStore.showAlert('Error', fetchError?.message ?? 'Gagal memuat data transaksi', 'error')
    emit('update:open', false)
    emit('processed')
    return
  }

  paymentSuccessInvoice.value = buildInvoiceFromTransaction(
    transactionDetails,
    method,
    { queueNumber, paidAt: transaction.paid_at ?? new Date().toISOString() },
  )
  paymentSuccessDialogOpen.value = true
  emit('update:open', false)
  emit('processed')
}

function handleProcessClick() {
  paymentDialogOpen.value = true
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>Proses Pesanan</DialogTitle>
        <DialogDescription v-if="preOrder">
          {{ formatPreOrderNumber(preOrder.order_number) }} · {{ getPreOrderPaymentLabel(preOrder) }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="preOrder" class="space-y-4">
        <div class="space-y-2">
          <p
            v-for="item in items"
            :key="item.id"
            class="rounded-lg border px-3 py-2 text-sm"
          >
            {{ formatPreOrderItemWithAddons(item) }}
            <span class="text-muted-foreground"> — {{ formatPrice(item.subtotal) }}</span>
          </p>
        </div>

        <div class="flex items-center justify-between border-t pt-4">
          <span class="text-sm text-muted-foreground">Total</span>
          <span class="text-lg font-bold">{{ formatPrice(preOrder.total_amount) }}</span>
        </div>

        <Field>
          <FieldLabel for="process-table-number">Nomor meja</FieldLabel>
          <Input
            id="process-table-number"
            v-model="tableNumber"
            placeholder="Opsional"
          />
        </Field>

        <div class="flex items-center justify-between rounded-lg border px-3 py-3">
          <div>
            <p class="text-sm font-medium">Masukkan antrian dapur</p>
            <p class="text-xs text-muted-foreground">Pesanan akan muncul di halaman antrian</p>
          </div>
          <Switch v-model="addToQueue" />
        </div>

        <p class="text-sm text-muted-foreground">
          Pembeli walk-in wajib lunas saat diproses. Pilih metode pembayaran pada langkah berikutnya.
        </p>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="outline">Batal</Button>
        </DialogClose>
        <Button :disabled="isSubmitting || !preOrder" @click="handleProcessClick">
          {{ isSubmitting ? 'Memproses...' : 'Lanjut Bayar' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <PaymentMethodDialog
    v-model:open="paymentDialogOpen"
    :transaction="null"
    :amount="preOrder?.total_amount ?? 0"
    @select="handlePayment"
  />

  <PaymentSuccessDialog
    v-model:open="paymentSuccessDialogOpen"
    :invoice="paymentSuccessInvoice"
  />
</template>
