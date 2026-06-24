<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/composables/useI18n'
import { applyStockOpname } from '@/lib/stock'
import { useAlertStore } from '@/stores/useAlertStore'
import type { Product } from '@/types/database'

type OpnameFormState = {
  physical_count: number
  reason: string
}

const props = defineProps<{
  open: boolean
  product: Product | null
}>()

const { t } = useI18n()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const alertStore = useAlertStore()
const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})

const defaultForm = (product: Product | null): OpnameFormState => ({
  physical_count: product?.stock_quantity ?? 0,
  reason: '',
})

const form = ref<OpnameFormState>(defaultForm(null))

const systemStock = computed(() => props.product?.stock_quantity ?? 0)

const delta = computed(() => form.value.physical_count - systemStock.value)

const deltaLabel = computed(() => {
  if (delta.value === 0) return t('opname.deltaMatch')
  if (delta.value > 0) return t('opname.deltaSurplus', { count: delta.value })
  return t('opname.deltaShortage', { count: Math.abs(delta.value) })
})

const deltaClass = computed(() => {
  if (delta.value === 0) return 'text-muted-foreground'
  if (delta.value > 0) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-destructive'
})

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return

    errors.value = {}
    form.value = defaultForm(props.product)
  },
)

function setError(fieldErrors: Record<string, string[] | undefined>) {
  errors.value = Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(([, messages]) => messages?.length)
      .map(([field, messages]) => [field, messages![0]!]),
  )
}

async function handleSubmit() {
  if (!props.product) return

  isSubmitting.value = true
  errors.value = {}

  const result = await applyStockOpname({
    product_id: props.product.id,
    physical_count: form.value.physical_count,
    reason: form.value.reason,
  })

  isSubmitting.value = false

  if (result.error && typeof result.error === 'object' && !('message' in result.error)) {
    setError(result.error as Record<string, string[] | undefined>)
    return
  }

  if (result.error) {
    const message = 'message' in (result.error as object)
      ? (result.error as { message: string }).message
      : t('opname.failed')
    alertStore.showAlert(t('alert.error'), message, 'error')
    return
  }

  alertStore.showAlert(
    t('alert.success'),
    t('opname.success', { name: props.product.name }),
    'success',
  )
  emit('update:open', false)
  emit('saved')
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>{{ t('opname.dialogTitle') }}</DialogTitle>
        <DialogDescription>
          {{ t('opname.dialogDesc', { name: product?.name ?? t('common.product') }) }}
        </DialogDescription>
      </DialogHeader>

      <form v-if="product" class="grid gap-4" @submit.prevent="handleSubmit">
        <FieldGroup>
          <Field>
            <FieldLabel>{{ t('opname.systemStock') }}</FieldLabel>
            <Input :model-value="systemStock" type="number" disabled />
          </Field>

          <Field>
            <FieldLabel for="opname-physical-count">{{ t('opname.physicalCount') }}</FieldLabel>
            <Input
              id="opname-physical-count"
              v-model.number="form.physical_count"
              type="number"
              min="0"
              required
            />
            <p v-if="errors.physical_count" class="text-sm text-destructive">{{ errors.physical_count }}</p>
          </Field>

          <div class="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <span class="text-muted-foreground">{{ t('opname.difference') }} </span>
            <span class="font-semibold" :class="deltaClass">{{ deltaLabel }}</span>
          </div>

          <Field>
            <FieldLabel for="opname-reason">{{ t('opname.reason') }}</FieldLabel>
            <Textarea
              id="opname-reason"
              v-model="form.reason"
              :placeholder="t('opname.reasonPlaceholder')"
              rows="3"
              required
            />
            <p v-if="errors.reason" class="text-sm text-destructive">{{ errors.reason }}</p>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">{{ t('common.cancel') }}</Button>
          </DialogClose>
          <Button type="submit" :disabled="isSubmitting || delta === 0 || !form.reason.trim()">
            {{ isSubmitting ? t('common.saving') : t('opname.save') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
