<script setup lang="ts">
import { Printer } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getShopConfig } from '@/lib/config'
import { applyShopInfoToInvoice, getPaymentMethodLabel, type InvoiceData } from '@/lib/invoice'
import { formatInvoiceSummaryAmount, printInvoice } from '@/lib/print-invoice'
import { formatQueueNumber } from '@/lib/format'

const props = defineProps<{
  open: boolean
  invoice: InvoiceData | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

async function handlePrint() {
  if (!props.invoice) return

  const { config } = await getShopConfig()
  const invoiceWithShop = applyShopInfoToInvoice(
    props.invoice,
    config?.shop_name,
    config?.shop_address,
  )
  printInvoice(invoiceWithShop)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[420px]">
      <DialogHeader>
        <DialogTitle>Pembayaran Berhasil</DialogTitle>
        <DialogDescription v-if="invoice">
          Transaksi {{ invoice.invoiceNumber }} telah dicatat sebagai lunas.
        </DialogDescription>
      </DialogHeader>

      <div v-if="invoice" class="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm">
        <div class="flex justify-between gap-4">
          <span class="text-muted-foreground">Pelanggan</span>
          <span class="font-medium">{{ invoice.customerName }}</span>
        </div>
        <div class="flex justify-between gap-4">
          <span class="text-muted-foreground">Total</span>
          <span class="font-bold">{{ formatInvoiceSummaryAmount(invoice.totalAmount) }}</span>
        </div>
        <div class="flex justify-between gap-4">
          <span class="text-muted-foreground">Metode</span>
          <span class="font-medium">{{ getPaymentMethodLabel(invoice.paymentMethod) }}</span>
        </div>
        <div
          v-if="invoice.queueNumber != null"
          class="flex justify-between gap-4"
        >
          <span class="text-muted-foreground">Antrian</span>
          <span class="font-medium">{{ formatQueueNumber(invoice.queueNumber) }}</span>
        </div>
      </div>

      <DialogFooter class="gap-2 sm:gap-0">
        <Button variant="outline" @click="handleClose">
          Selesai
        </Button>
        <Button :disabled="!invoice" @click="handlePrint">
          <Printer class="size-4" />
          Cetak Invoice
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
