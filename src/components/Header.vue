<script setup lang="ts">
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
</script>

<template>
    <header class="flex justify-between h-16 shrink-0 items-center gap-2 border-b px-4">
        <div class="flex items-center gap-2">
            <SidebarTrigger class="-ml-1" />
            <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
        </div>
        <div class="flex items-center gap-2">
            <ThemeSwitcher />
        </div>
    </header>
</template>