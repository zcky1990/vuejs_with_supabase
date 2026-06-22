<script setup lang="ts">
import AppSidebar from "@/components/AppSidebar.vue"
import AppAlert from "@/components/AppAlert.vue"    
import Header from "@/components/Header.vue"    
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
</script>

<template>
    <SidebarProvider>
        <div class="flex flex-col items-center justify-center w-full fixed top-0 z-50">
            <AppAlert />
        </div>
        <AppSidebar />
        <SidebarInset>
            <Header />
            <slot />
        </SidebarInset>
  </SidebarProvider>
</template>