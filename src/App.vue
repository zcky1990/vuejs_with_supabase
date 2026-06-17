<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppAlert from '@/components/AppAlert.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full fixed top-0 z-50">
    <AppAlert />
  </div>
  <div class="fixed top-4 right-4 z-50">
    <ThemeSwitcher />
  </div>
  <RouterView />
</template>
