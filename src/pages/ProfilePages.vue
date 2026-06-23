<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Trash2, Upload, User } from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { useI18n } from '@/composables/useI18n'
import {
  getCurrentUser,
  removeAvatarImage,
  updatePassword,
  updateProfile,
  uploadAvatarImage,
} from '@/lib/auth'
import { useAlertStore } from '@/stores/useAlertStore'
import type { UserProfile } from '@/lib/auth'

const { t, locale } = useI18n()
const alertStore = useAlertStore()

const isLoading = ref(true)
const isSavingProfile = ref(false)
const isSavingPassword = ref(false)
const isUploadingAvatar = ref(false)
const isRemovingAvatar = ref(false)
const profile = ref<UserProfile | null>(null)
const avatarPreview = ref<string | null>(null)
const avatarInput = ref<HTMLInputElement | null>(null)

const profileForm = ref({ fullName: '' })
const passwordForm = ref({ password: '', confirmPassword: '' })

const dateLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'id-ID'))

const initials = computed(() => {
  const name = profileForm.value.fullName.trim() || profile.value?.email || '?'
  return name.charAt(0).toUpperCase()
})

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat(dateLocale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatAuthError(error: unknown): string {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message)
  }
  if (error && typeof error === 'object') {
    const fields = error as Record<string, string[] | undefined>
    const first = Object.values(fields).flat().find(Boolean)
    if (first) return first
  }
  return t('alert.error')
}

async function loadProfile() {
  isLoading.value = true
  const { user, error } = await getCurrentUser()
  isLoading.value = false

  if (error || !user) {
    alertStore.showAlert(t('alert.error'), error?.message ?? t('profile.updateFailed'), 'error')
    return
  }

  profile.value = user
  profileForm.value.fullName = user.fullName
  avatarPreview.value = user.avatarUrl
}

async function handleAvatarUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file || !profile.value) return

  isUploadingAvatar.value = true
  const { url, error } = await uploadAvatarImage(file, profile.value.id)
  isUploadingAvatar.value = false

  if (error || !url) {
    alertStore.showAlert(t('alert.error'), formatAuthError(error) || t('profile.avatarUploadFailed'), 'error')
    return
  }

  avatarPreview.value = url
  profile.value.avatarUrl = url
  window.dispatchEvent(new Event('user-avatar-changed'))
  alertStore.showAlert(t('alert.success'), t('profile.avatarUploaded'), 'success')
}

async function handleRemoveAvatar() {
  if (!profile.value) return

  isRemovingAvatar.value = true
  const { error } = await removeAvatarImage(profile.value.id, avatarPreview.value)
  isRemovingAvatar.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), formatAuthError(error) || t('profile.avatarRemoveFailed'), 'error')
    return
  }

  avatarPreview.value = null
  profile.value.avatarUrl = null
  window.dispatchEvent(new Event('user-avatar-changed'))
  alertStore.showAlert(t('alert.success'), t('profile.avatarRemoved'), 'success')
}

async function handleSaveProfile() {
  isSavingProfile.value = true
  const { error } = await updateProfile({ fullName: profileForm.value.fullName })
  isSavingProfile.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), formatAuthError(error), 'error')
    return
  }

  if (profile.value) {
    profile.value.fullName = profileForm.value.fullName.trim()
  }

  alertStore.showAlert(t('alert.success'), t('profile.profileUpdated'), 'success')
}

async function handleSavePassword() {
  isSavingPassword.value = true
  const { error } = await updatePassword(passwordForm.value)
  isSavingPassword.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), formatAuthError(error), 'error')
    return
  }

  passwordForm.value = { password: '', confirmPassword: '' }
  alertStore.showAlert(t('alert.success'), t('profile.passwordUpdated'), 'success')
}

onMounted(loadProfile)
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6 p-6">
      <div class="flex items-center gap-3">
        <div class="flex size-10 items-center justify-center rounded-lg border bg-muted">
          <User class="size-5" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight">{{ t('profile.title') }}</h1>
          <p class="text-sm text-muted-foreground">{{ t('profile.subtitle') }}</p>
        </div>
      </div>

      <div v-if="isLoading" class="py-16 text-center text-sm text-muted-foreground">
        {{ t('common.loading') }}
      </div>

      <div v-else class="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{{ t('profile.account') }}</CardTitle>
            <CardDescription>{{ t('profile.accountDesc') }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="mb-6 space-y-4">
              <div>
                <p class="mb-2 text-sm font-medium">{{ t('profile.avatar') }}</p>
                <p class="mb-3 text-xs text-muted-foreground">{{ t('profile.avatarDesc') }}</p>
                <div class="flex flex-wrap items-center gap-4">
                  <Avatar class="size-20">
                    <AvatarImage v-if="avatarPreview" :src="avatarPreview" :alt="profileForm.fullName" />
                    <AvatarFallback class="text-xl">{{ initials }}</AvatarFallback>
                  </Avatar>
                  <div class="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      :disabled="isUploadingAvatar || isRemovingAvatar"
                      @click="avatarInput?.click()"
                    >
                      <Upload class="size-4" />
                      {{ isUploadingAvatar ? t('common.saving') : t('profile.uploadAvatar') }}
                    </Button>
                    <Button
                      v-if="avatarPreview"
                      type="button"
                      variant="outline"
                      :disabled="isUploadingAvatar || isRemovingAvatar"
                      @click="handleRemoveAvatar"
                    >
                      <Trash2 class="size-4" />
                      {{ isRemovingAvatar ? t('common.saving') : t('profile.removeAvatar') }}
                    </Button>
                    <input
                      ref="avatarInput"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      class="hidden"
                      @change="handleAvatarUpload"
                    >
                  </div>
                </div>
              </div>

              <div class="text-sm text-muted-foreground">
                <p>{{ t('profile.memberSince') }}: {{ formatDate(profile?.createdAt ?? null) }}</p>
                <p>{{ t('profile.lastSignIn') }}: {{ formatDate(profile?.lastSignInAt ?? null) }}</p>
              </div>
            </div>

            <form class="space-y-4" @submit.prevent="handleSaveProfile">
              <FieldGroup>
                <Field>
                  <FieldLabel for="profile-name">{{ t('auth.fullName') }}</FieldLabel>
                  <Input
                    id="profile-name"
                    v-model="profileForm.fullName"
                    :placeholder="t('auth.fullName')"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel for="profile-email">{{ t('auth.email') }}</FieldLabel>
                  <Input
                    id="profile-email"
                    :model-value="profile?.email ?? ''"
                    type="email"
                    disabled
                  />
                  <p class="text-xs text-muted-foreground">{{ t('profile.emailReadonly') }}</p>
                </Field>
              </FieldGroup>
              <Button type="submit" :disabled="isSavingProfile">
                {{ isSavingProfile ? t('common.saving') : t('profile.saveProfile') }}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{{ t('profile.password') }}</CardTitle>
            <CardDescription>{{ t('profile.passwordDesc') }}</CardDescription>
          </CardHeader>
          <CardContent>
            <form class="space-y-4" @submit.prevent="handleSavePassword">
              <FieldGroup>
                <Field>
                  <FieldLabel for="new-password">{{ t('profile.newPassword') }}</FieldLabel>
                  <Input
                    id="new-password"
                    v-model="passwordForm.password"
                    type="password"
                    autocomplete="new-password"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel for="confirm-new-password">{{ t('profile.confirmNewPassword') }}</FieldLabel>
                  <Input
                    id="confirm-new-password"
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    autocomplete="new-password"
                    required
                  />
                </Field>
              </FieldGroup>
              <Button type="submit" :disabled="isSavingPassword">
                {{ isSavingPassword ? t('common.saving') : t('profile.savePassword') }}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card class="lg:col-span-2">
          <CardHeader>
            <CardTitle>{{ t('profile.preferences') }}</CardTitle>
            <CardDescription>{{ t('profile.preferencesDesc') }}</CardDescription>
          </CardHeader>
          <CardContent class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">{{ t('language.label') }}</span>
              <LanguageSwitcher />
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">{{ t('theme.label') }}</span>
              <ThemeSwitcher />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </DashboardLayout>
</template>
