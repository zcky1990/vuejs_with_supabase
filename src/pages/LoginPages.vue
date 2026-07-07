<script setup lang="ts">
import LoginForm from '@/components/new-york-v4/blocks/login-01/components/LoginForm.vue'
import ApplicationLayout from '@/layouts/ApplicationLayout.vue'
import { useRoleStore } from '@/stores/useRoleStore'
import { useI18n } from '@/composables/useI18n'
import { useAlertStore } from '@/stores/useAlertStore'
import { login } from '@/lib/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const alertStore = useAlertStore()
const roleStore = useRoleStore()
const { t } = useI18n()

function formatAuthError(error: unknown): string {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const fields = error as Record<string, string[] | undefined>
    const first = Object.values(fields).flat().find(Boolean)
    if (first) return first
  }
  return t('alert.error')
}

const handleLogin = async (email: string, password: string) => {
  const { data, error } = await login({ email, password })
  if (error) {
    alertStore.showAlert(t('alert.error'), formatAuthError(error), 'error')
  } else if (data?.session) {
    await roleStore.loadRole(true)
    router.push('/dashboard')
  }
}
</script>

<template>
  <ApplicationLayout>
    <div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div class="w-full max-w-sm">
        <LoginForm :on-submit="handleLogin" />
      </div>
    </div>
  </ApplicationLayout>
</template>
