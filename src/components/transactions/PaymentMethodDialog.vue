<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowLeft, Banknote, QrCode, Smartphone } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/composables/useI18n'
import { getShopConfig, isLoyaltyEnabled } from '@/lib/config'
import { getCustomerById } from '@/lib/customer'
import { formatPrice } from '@/lib/format'
import {
  buildLoyaltyPaymentPreview,
  isLoyaltyEligibleCustomer,
  maxRedeemablePoints,
} from '@/lib/loyalty'
import type { Customer, PaymentMethod, ShopConfig, TransactionWithDetails } from '@/types/database'

const props = defineProps<{
  open: boolean
  transaction: TransactionWithDetails | null
  amount?: number
  customer?: Customer | null
}>()

const { t } = useI18n()

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [method: PaymentMethod, loyaltyPointsRedeemed?: number]
}>()

const paymentOptions = computed(() => [
  { value: 'qris' as const, label: t('payment.qris'), icon: QrCode },
  { value: 'cash' as const, label: t('payment.cash'), icon: Banknote },
  { value: 'transfer' as const, label: t('payment.transfer'), icon: Smartphone },
])

const selectedMethod = ref<PaymentMethod | null>(null)
const shopConfig = ref<ShopConfig | null>(null)
const loyaltyCustomer = ref<Customer | null>(null)
const isLoadingConfig = ref(false)
const pointsToRedeem = ref(0)

const grossAmount = computed(() =>
  Number(props.transaction?.gross_amount ?? props.transaction?.total_amount ?? props.amount ?? 0),
)

const loyaltyPreview = computed(() =>
  buildLoyaltyPaymentPreview(
    loyaltyCustomer.value,
    grossAmount.value,
    pointsToRedeem.value,
    shopConfig.value,
  ),
)

const displayAmount = computed(() => loyaltyPreview.value?.finalTotal ?? grossAmount.value)

const maxRedeemPoints = computed(() => {
  if (!loyaltyCustomer.value || !shopConfig.value) return 0
  return maxRedeemablePoints(
    loyaltyCustomer.value.loyalty_points,
    grossAmount.value,
    shopConfig.value,
  )
})

const showLoyaltySection = computed(() =>
  isLoyaltyEnabled(shopConfig.value) && isLoyaltyEligibleCustomer(loyaltyCustomer.value),
)

function resetState() {
  selectedMethod.value = null
  shopConfig.value = null
  loyaltyCustomer.value = null
  pointsToRedeem.value = 0
}

async function loadDialogData() {
  isLoadingConfig.value = true
  const [{ config }, customerResult] = await Promise.all([
    getShopConfig(),
    props.transaction?.customer_id
      ? getCustomerById(props.transaction.customer_id)
      : Promise.resolve({ customer: props.customer ?? null, error: null }),
  ])
  shopConfig.value = config
  loyaltyCustomer.value = customerResult.customer
  pointsToRedeem.value = 0
  isLoadingConfig.value = false
}

function handleOpenChange(isOpen: boolean) {
  emit('update:open', isOpen)
  if (!isOpen) {
    resetState()
  }
}

function selectMethod(method: PaymentMethod) {
  selectedMethod.value = method
}

function goBack() {
  selectedMethod.value = null
}

function confirmPayment() {
  if (!selectedMethod.value) return
  emit('select', selectedMethod.value, loyaltyPreview.value?.pointsRedeemed ?? 0)
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      loadDialogData()
    }
  },
)

watch(maxRedeemPoints, (maxPoints) => {
  if (pointsToRedeem.value > maxPoints) {
    pointsToRedeem.value = maxPoints
  }
})

watch(
  () => selectedMethod.value,
  (method) => {
    if ((method === 'qris' || method === 'transfer') && !shopConfig.value) {
      loadDialogData()
    }
  },
)
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[420px]">
      <DialogHeader>
        <DialogTitle>
          {{ selectedMethod ? t('payment.confirmPayment') : t('payment.chooseMethod') }}
        </DialogTitle>
        <DialogDescription>
          {{ t('payment.totalLabel') }} {{ formatPrice(displayAmount) }}
        </DialogDescription>
      </DialogHeader>

      <div
        v-if="showLoyaltySection && !selectedMethod"
        class="space-y-3 rounded-xl border bg-muted/20 p-4"
      >
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ t('loyalty.pointsBalance') }}</span>
          <span class="font-semibold">{{ loyaltyCustomer?.loyalty_points ?? 0 }} {{ t('loyalty.points') }}</span>
        </div>
        <Field>
          <FieldLabel for="loyalty-redeem">{{ t('loyalty.redeemPoints') }}</FieldLabel>
          <Input
            id="loyalty-redeem"
            v-model.number="pointsToRedeem"
            type="number"
            min="0"
            :max="maxRedeemPoints"
            step="1"
          />
        </Field>
        <p class="text-xs text-muted-foreground">
          {{ t('loyalty.maxRedeemable', { count: maxRedeemPoints }) }}
        </p>
        <p v-if="loyaltyPreview?.discountAmount" class="text-sm text-emerald-700 dark:text-emerald-300">
          {{ t('loyalty.discount') }}: -{{ formatPrice(loyaltyPreview.discountAmount) }}
        </p>
        <p v-if="loyaltyPreview?.pointsEarned" class="text-xs text-muted-foreground">
          {{ t('loyalty.earnOnPayment', { count: loyaltyPreview.pointsEarned }) }}
        </p>
      </div>

      <div v-if="!selectedMethod" class="grid gap-3">
        <button
          v-for="option in paymentOptions"
          :key="option.value"
          type="button"
          class="flex items-center gap-3 rounded-xl border px-4 py-4 text-left transition-colors hover:bg-accent"
          @click="selectMethod(option.value)"
        >
          <div class="flex size-10 items-center justify-center rounded-lg bg-foreground text-background">
            <component :is="option.icon" class="size-5" />
          </div>
          <span class="font-medium">{{ option.label }}</span>
        </button>
      </div>

      <div v-else class="space-y-4">
        <div v-if="selectedMethod === 'qris'" class="space-y-4">
          <div
            v-if="isLoadingConfig"
            class="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground"
          >
            {{ t('payment.loadingQris') }}
          </div>
          <div
            v-else-if="shopConfig?.qris_image_url"
            class="flex justify-center rounded-xl border bg-muted/30 p-4"
          >
            <img
              :src="shopConfig.qris_image_url"
              alt="QRIS"
              class="max-h-64 max-w-full rounded-lg object-contain"
            >
          </div>
          <div
            v-else
            class="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
          >
            {{ t('payment.noQris') }}
          </div>
          <p class="text-sm text-muted-foreground">
            {{ t('payment.scanQris') }}
          </p>
        </div>

        <div v-else-if="selectedMethod === 'transfer'" class="space-y-4">
          <div
            v-if="isLoadingConfig"
            class="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground"
          >
            {{ t('payment.loadingBank') }}
          </div>
          <div
            v-else-if="shopConfig?.transfer_account_number"
            class="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm"
          >
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">{{ t('payment.bank') }}</span>
              <span class="font-medium">{{ shopConfig.transfer_bank_name || '-' }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">{{ t('payment.accountNumber') }}</span>
              <span class="font-mono font-semibold">{{ shopConfig.transfer_account_number }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">{{ t('payment.accountHolder') }}</span>
              <span class="font-medium">{{ shopConfig.transfer_account_holder || '-' }}</span>
            </div>
            <div class="flex justify-between gap-4 border-t pt-3">
              <span class="text-muted-foreground">{{ t('common.amount') }}</span>
              <span class="font-bold">{{ formatPrice(displayAmount) }}</span>
            </div>
          </div>
          <div
            v-else
            class="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
          >
            {{ t('payment.noBank') }}
          </div>
          <p class="text-sm text-muted-foreground">
            {{ t('payment.transferNote') }}
          </p>
        </div>

        <div v-else class="rounded-xl border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          {{ t('payment.cashNote') }}
        </div>

        <div class="flex gap-2">
          <Button variant="outline" class="flex-1" @click="goBack">
            <ArrowLeft class="size-4" />
            {{ t('common.back') }}
          </Button>
          <Button class="flex-1" @click="confirmPayment">
            {{ t('payment.confirmPaid') }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
