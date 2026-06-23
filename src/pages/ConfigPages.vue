<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ImageIcon, Landmark, Printer, QrCode, Trash2, Upload } from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { getShopConfig, removeQrisImage, updateShopConfig, uploadQrisImage } from '@/lib/config'
import { useAlertStore } from '@/stores/useAlertStore'
import type { ShopConfig } from '@/types/database'

const alertStore = useAlertStore()
const isLoading = ref(true)
const isSavingTransfer = ref(false)
const isSavingReceipt = ref(false)
const isUploadingQris = ref(false)
const isRemovingQris = ref(false)
const qrisPreview = ref<string | null>(null)

const transferForm = ref({
  transfer_bank_name: '',
  transfer_account_number: '',
  transfer_account_holder: '',
})

const receiptForm = ref({
  shop_name: '',
  shop_address: '',
})

function applyConfig(config: ShopConfig | null) {
  qrisPreview.value = config?.qris_image_url ?? null
  transferForm.value = {
    transfer_bank_name: config?.transfer_bank_name ?? '',
    transfer_account_number: config?.transfer_account_number ?? '',
    transfer_account_holder: config?.transfer_account_holder ?? '',
  }
  receiptForm.value = {
    shop_name: config?.shop_name ?? '',
    shop_address: config?.shop_address ?? '',
  }
}

async function loadConfig() {
  isLoading.value = true
  const { config, error } = await getShopConfig()
  isLoading.value = false

  if (error) {
    alertStore.showAlert('Error', error.message, 'error')
    return
  }

  applyConfig(config)
}

async function handleQrisUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) return

  if (!file.type.startsWith('image/')) {
    alertStore.showAlert('Error', 'File harus berupa gambar', 'error')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    alertStore.showAlert('Error', 'Ukuran gambar maksimal 5 MB', 'error')
    return
  }

  isUploadingQris.value = true
  const { url, error } = await uploadQrisImage(file)
  isUploadingQris.value = false

  if (error) {
    alertStore.showAlert('Error', error.message, 'error')
    return
  }

  qrisPreview.value = url
  alertStore.showAlert('Berhasil', 'Gambar QRIS berhasil diunggah', 'success')
}

async function handleRemoveQris() {
  if (!confirm('Hapus gambar QRIS?')) return

  isRemovingQris.value = true
  const { error } = await removeQrisImage()
  isRemovingQris.value = false

  if (error) {
    const message = typeof error === 'object' && 'message' in error
      ? String(error.message)
      : 'Gagal menghapus gambar QRIS'
    alertStore.showAlert('Error', message, 'error')
    return
  }

  qrisPreview.value = null
  alertStore.showAlert('Berhasil', 'Gambar QRIS dihapus', 'success')
}

async function handleSaveTransfer() {
  isSavingTransfer.value = true
  const { error } = await updateShopConfig(transferForm.value)
  isSavingTransfer.value = false

  if (error) {
    const message = typeof error === 'object' && 'message' in error
      ? String(error.message)
      : 'Gagal menyimpan data rekening'
    alertStore.showAlert('Error', message, 'error')
    return
  }

  alertStore.showAlert('Berhasil', 'Data rekening transfer disimpan', 'success')
}

async function handleSaveReceipt() {
  isSavingReceipt.value = true
  const { error } = await updateShopConfig({
    shop_name: receiptForm.value.shop_name.trim() || null,
    shop_address: receiptForm.value.shop_address.trim() || null,
  })
  isSavingReceipt.value = false

  if (error) {
    const message = typeof error === 'object' && 'message' in error
      ? String(error.message)
      : 'Gagal menyimpan info struk'
    alertStore.showAlert('Error', message, 'error')
    return
  }

  alertStore.showAlert('Berhasil', 'Info struk disimpan', 'success')
}

onMounted(loadConfig)
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6 p-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Konfigurasi Pembayaran</h1>
        <p class="text-sm text-muted-foreground">
          Atur gambar QRIS dan nomor rekening untuk pembayaran transfer.
        </p>
      </div>

      <div v-if="isLoading" class="rounded-xl border px-4 py-10 text-center text-muted-foreground">
        Memuat konfigurasi...
      </div>

      <div v-else class="grid gap-6 lg:grid-cols-2">
        <Card class="lg:col-span-2">
          <CardHeader>
            <div class="flex items-center gap-3">
              <div class="flex size-10 items-center justify-center rounded-lg bg-foreground text-background">
                <Printer class="size-5" />
              </div>
              <div>
                <CardTitle>Info Struk</CardTitle>
                <CardDescription>Nama dan alamat toko yang dicetak di invoice thermal.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form class="max-w-xl" @submit.prevent="handleSaveReceipt">
              <FieldGroup>
                <Field>
                  <FieldLabel for="shop-name">Nama Toko</FieldLabel>
                  <Input
                    id="shop-name"
                    v-model="receiptForm.shop_name"
                    placeholder="Contoh: Warung Zavi"
                  />
                </Field>
                <Field>
                  <FieldLabel for="shop-address">Alamat (opsional)</FieldLabel>
                  <Input
                    id="shop-address"
                    v-model="receiptForm.shop_address"
                    placeholder="Contoh: Jl. Contoh No. 1"
                  />
                </Field>
              </FieldGroup>
              <Button type="submit" class="mt-6" :disabled="isSavingReceipt">
                {{ isSavingReceipt ? 'Menyimpan...' : 'Simpan Info Struk' }}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div class="flex items-center gap-3">
              <div class="flex size-10 items-center justify-center rounded-lg bg-foreground text-background">
                <QrCode class="size-5" />
              </div>
              <div>
                <CardTitle>QRIS</CardTitle>
                <CardDescription>Unggah gambar kode QR untuk pembayaran QRIS.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent class="space-y-4">
            <div
              class="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed bg-muted/30 p-4"
            >
              <img
                v-if="qrisPreview"
                :src="qrisPreview"
                alt="QRIS"
                class="max-h-64 max-w-full rounded-lg object-contain"
              >
              <div v-else class="text-center text-sm text-muted-foreground">
                <ImageIcon class="mx-auto mb-2 size-8 opacity-50" />
                Belum ada gambar QRIS
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <Button as-child :disabled="isUploadingQris">
                <label class="cursor-pointer">
                  <Upload class="size-4" />
                  {{ isUploadingQris ? 'Mengunggah...' : 'Unggah Gambar' }}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    class="hidden"
                    :disabled="isUploadingQris"
                    @change="handleQrisUpload"
                  >
                </label>
              </Button>
              <Button
                v-if="qrisPreview"
                variant="outline"
                :disabled="isRemovingQris"
                @click="handleRemoveQris"
              >
                <Trash2 class="size-4" />
                Hapus
              </Button>
            </div>
            <p class="text-xs text-muted-foreground">
              Format: PNG, JPG, WEBP. Maksimal 5 MB.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div class="flex items-center gap-3">
              <div class="flex size-10 items-center justify-center rounded-lg bg-foreground text-background">
                <Landmark class="size-5" />
              </div>
              <div>
                <CardTitle>Transfer Bank</CardTitle>
                <CardDescription>Data rekening yang ditampilkan saat pelanggan memilih transfer.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form @submit.prevent="handleSaveTransfer">
              <FieldGroup>
                <Field>
                  <FieldLabel for="bank-name">Nama Bank</FieldLabel>
                  <Input
                    id="bank-name"
                    v-model="transferForm.transfer_bank_name"
                    placeholder="Contoh: BCA"
                  />
                </Field>
                <Field>
                  <FieldLabel for="account-number">Nomor Rekening</FieldLabel>
                  <Input
                    id="account-number"
                    v-model="transferForm.transfer_account_number"
                    placeholder="Contoh: 1234567890"
                  />
                </Field>
                <Field>
                  <FieldLabel for="account-holder">Atas Nama</FieldLabel>
                  <Input
                    id="account-holder"
                    v-model="transferForm.transfer_account_holder"
                    placeholder="Contoh: Warung Zavi"
                  />
                </Field>
              </FieldGroup>

              <Button type="submit" class="mt-6" :disabled="isSavingTransfer">
                {{ isSavingTransfer ? 'Menyimpan...' : 'Simpan Rekening' }}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  </DashboardLayout>
</template>
