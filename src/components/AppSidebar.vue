<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar'
import UserNav from '@/components/UserNav.vue'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

import { getCookie, clearAuthCookies } from '@/lib/cookies'
import { useRouter } from 'vue-router'


const userEmail = getCookie('_user_email')
const router = useRouter()
const props = defineProps<SidebarProps>()

// This is sample data.
const data = {
  email: userEmail,
  menu: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: 'dashboard',
      onClick: () => {
        router.push('/dashboard')
      },
    },
    {
      title: 'Profile',
      url: '/profile',
      icon: 'profile',
      onClick: () => {
        router.push('/profile')
      },
    },
    {
      title: 'Logout',
      url: '/logout',
      icon: 'logout',
      onClick: () => {
        clearAuthCookies()
        router.push('/login')
      },
    },
  ]
}
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <UserNav
        :email="data.email"
        :menu="data.menu"
      />

    </SidebarHeader>
    <SidebarContent>
      
    </SidebarContent>
    <SidebarRail />
  </Sidebar>
</template>
