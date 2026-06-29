<script setup lang="ts">
import { ref, watch } from 'vue'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { createCustomer, updateCustomer } from '@/lib/customer'
import { useI18n } from '@/composables/useI18n'
import { useAlertStore } from '@/stores/useAlertStore'
import type { Customer } from '@/types/database'

type CustomerFormState = {
  name: string
  email: string
  phone: string
  address: string
  notes: string
  is_active: boolean
  is_member: boolean
}

const props = defineProps<{
  open: boolean
  customer?: Customer | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const { t } = useI18n()
const alertStore = useAlertStore()
const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})

const defaultForm = (): CustomerFormState => ({
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
  is_active: true,
  is_member: false,
})

const form = ref<CustomerFormState>(defaultForm())

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return

    errors.value = {}
    form.value = props.customer
      ? {
          name: props.customer.name,
          email: props.customer.email ?? '',
          phone: props.customer.phone ?? '',
          address: props.customer.address ?? '',
          notes: props.customer.notes ?? '',
          is_active: props.customer.is_active,
          is_member: props.customer.is_member,
        }
      : defaultForm()
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
  isSubmitting.value = true
  errors.value = {}

  const payload = {
    name: form.value.name,
    email: form.value.email || null,
    phone: form.value.phone || null,
    address: form.value.address || null,
    notes: form.value.notes || null,
    is_active: form.value.is_active,
    is_member: form.value.is_member,
  }

  const result = props.customer
    ? await updateCustomer(props.customer.id, payload)
    : await createCustomer(payload)

  isSubmitting.value = false

  if (result.error && typeof result.error === 'object') {
    setError(result.error as Record<string, string[] | undefined>)
    return
  }

  if (result.error) {
    alertStore.showAlert(t('alert.error'), t('master.customerSaveFailed'), 'error')
    return
  }

  alertStore.showAlert(
    t('alert.success'),
    props.customer ? t('master.customerUpdated') : t('master.customerCreated'),
    'success',
  )
  emit('update:open', false)
  emit('saved')
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>{{ customer ? t('master.editCustomer') : t('master.addCustomer') }}</DialogTitle>
        <DialogDescription>
          {{ customer ? t('master.customerEditDesc') : t('master.customerAddDesc') }}
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="handleSubmit">
        <FieldGroup>
          <Field>
            <FieldLabel for="customer-name">{{ t('master.name') }}</FieldLabel>
            <Input id="customer-name" v-model="form.name" :placeholder="t('master.customerNamePh')" required />
            <p v-if="errors.name" class="text-sm text-destructive">{{ errors.name }}</p>
          </Field>

          <div class="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel for="customer-email">{{ t('master.email') }}</FieldLabel>
              <Input id="customer-email" v-model="form.email" type="email" :placeholder="t('master.emailPh')" />
              <p v-if="errors.email" class="text-sm text-destructive">{{ errors.email }}</p>
            </Field>

            <Field>
              <FieldLabel for="customer-phone">{{ t('master.phone') }}</FieldLabel>
              <Input id="customer-phone" v-model="form.phone" :placeholder="t('master.phonePh')" />
            </Field>
          </div>

          <Field>
            <FieldLabel for="customer-address">{{ t('master.address') }}</FieldLabel>
            <Textarea id="customer-address" v-model="form.address" :placeholder="t('master.customerAddressPh')" rows="2" />
          </Field>

          <Field>
            <FieldLabel for="customer-notes">{{ t('common.notes') }}</FieldLabel>
            <Textarea id="customer-notes" v-model="form.notes" :placeholder="t('master.customerNotesPh')" rows="2" />
          </Field>

          <div class="flex items-center justify-between rounded-lg border p-4">
            <div class="space-y-0.5">
              <Label for="customer-member">{{ t('master.isMember') }}</Label>
              <p class="text-xs text-muted-foreground">{{ t('master.isMemberHint') }}</p>
            </div>
            <Switch id="customer-member" v-model="form.is_member" />
          </div>

          <div class="flex items-center justify-between rounded-lg border p-4">
            <div class="space-y-0.5">
              <Label for="customer-active">{{ t('common.active') }}</Label>
              <p class="text-xs text-muted-foreground">
                {{ form.is_active ? t('master.customerActiveHint') : t('master.customerInactiveHint') }}
              </p>
            </div>
            <Switch id="customer-active" v-model="form.is_active" />
          </div>
        </FieldGroup>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">{{ t('common.cancel') }}</Button>
          </DialogClose>
          <Button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? t('common.saving') : t('common.save') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
