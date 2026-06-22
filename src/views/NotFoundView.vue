<script setup lang="ts">
import ApplicationLayout from '@/layouts/ApplicationLayout.vue'
import { Button } from '@/components/ui/button'
import { RouterLink } from 'vue-router'
</script>

<template>
  <ApplicationLayout>
    <div class="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p class="text-sm font-medium text-muted-foreground">404</p>
      <h1 class="text-3xl font-bold tracking-tight">Halaman tidak ditemukan</h1>
      <p class="max-w-md text-muted-foreground">
        Halaman yang Anda cari tidak ada atau sudah dipindahkan.
      </p>
      <Button as-child>
        <RouterLink to="/">Kembali ke beranda</RouterLink>
      </Button>
    </div>
  </ApplicationLayout>
</template>
