<script setup lang="ts">
import LoginForm from '@/components/new-york-v4/blocks/login-01/components/LoginForm.vue'
import ApplicationLayout from '@/layouts/ApplicationLayout.vue'
import { persistAuthSession } from '@/lib/auth'
import { useAlertStore } from '@/stores/useAlertStore'
import { login } from '@/lib/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const alertStore = useAlertStore()

const handleLogin = async (email: string, password: string) => {
  const { data, error } = await login({ email, password })
  if (error) {
    alertStore.showAlert('Error', error as string, 'error')
  } else if (data?.session) {
    persistAuthSession(data?.session)
    router.push('/')
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
