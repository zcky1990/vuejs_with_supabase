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
import { useRouter, RouterLink } from 'vue-router'
import { BarChart3, ClipboardList, LayoutDashboard, List, LogOut, Package, PackagePlus, Receipt, Settings, User, Users } from '@lucide/vue'


const userEmail = getCookie('_user_email')
const router = useRouter()
const props = defineProps<SidebarProps>()

// This is sample data.
const data = {
  email: userEmail,
  menu: [
    {
      group: 'Account',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
          onClick: () => {
            router.push('/dashboard')
          },
        },
        {
          title: 'Profile',
          url: '/profile',
          icon: User,
          onClick: () => {
            router.push('/profile')
          },
        },
      ],
    },
    {
      group: 'Session',
      items: [
        {
          title: 'Logout',
          url: '/logout',
          icon: LogOut,
          onClick: () => {
            clearAuthCookies()
            router.push('/login')
          },
        },
      ],
    },
  ],
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
      <SidebarGroup>
        <SidebarGroupLabel>Operasional</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/transactions">
                  <Receipt />
                  <span>Buat Transaksi</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/transactions/list">
                  <List />
                  <span>Daftar Transaksi</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/queue">
                  <ClipboardList />
                  <span>Antrian</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/stock/restock">
                  <PackagePlus />
                  <span>Restock</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Laporan</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/analytics">
                  <BarChart3 />
                  <span>Analisis</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Master Data</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/master/products">
                  <Package />
                  <span>Produk</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/master/customers">
                  <Users />
                  <span>Pembeli</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Pengaturan</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/config">
                  <Settings />
                  <span>Konfigurasi</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarRail />
  </Sidebar>
</template>
