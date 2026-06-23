<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
import { getCurrentUser } from '@/lib/auth'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { BarChart3, ClipboardList, Inbox, LayoutDashboard, List, LogOut, Monitor, Package, PackagePlus, Receipt, Settings, Tags, User, Users, Wallet } from '@lucide/vue'

const userEmail = getCookie('_user_email')
const userAvatar = ref<string | null>(null)
const router = useRouter()
const { t, locale } = useI18n()
const props = defineProps<SidebarProps>()

async function loadUserAvatar() {
  const { user } = await getCurrentUser()
  userAvatar.value = user?.avatarUrl ?? null
}

const data = computed(() => {
  locale.value
  return {
  email: userEmail,
  menu: [
    {
      group: t('nav.account'),
      items: [
        {
          title: t('nav.dashboard'),
          url: '/dashboard',
          icon: LayoutDashboard,
          onClick: () => {
            router.push('/dashboard')
          },
        },
        {
          title: t('nav.profile'),
          url: '/profile',
          icon: User,
          onClick: () => {
            router.push('/profile')
          },
        },
      ],
    },
    {
      group: t('nav.session'),
      items: [
        {
          title: t('nav.logout'),
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
})

onMounted(() => {
  loadUserAvatar()
  window.addEventListener('user-avatar-changed', loadUserAvatar)
})

onUnmounted(() => {
  window.removeEventListener('user-avatar-changed', loadUserAvatar)
})
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <UserNav
        :email="data.email"
        :avatar-url="userAvatar"
        :menu="data.menu"
      />
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>{{ t('nav.home') }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/dashboard">
                  <LayoutDashboard />
                  <span>{{ t('nav.dashboard') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>{{ t('nav.operations') }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/transactions">
                  <Receipt />
                  <span>{{ t('nav.createTransaction') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/transactions/list">
                  <List />
                  <span>{{ t('nav.transactionList') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/orders/inbox">
                  <Inbox />
                  <span>{{ t('nav.orderInbox') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/queue">
                  <ClipboardList />
                  <span>{{ t('nav.queue') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/queue/display" target="_blank">
                  <Monitor />
                  <span>{{ t('nav.queueDisplay') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/stock/restock">
                  <PackagePlus />
                  <span>{{ t('nav.restock') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>{{ t('nav.reports') }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/analytics">
                  <BarChart3 />
                  <span>{{ t('nav.analytics') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/shifts">
                  <Wallet />
                  <span>{{ t('nav.shifts') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>{{ t('nav.masterData') }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/master/products">
                  <Package />
                  <span>{{ t('nav.products') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/master/categories">
                  <Tags />
                  <span>{{ t('nav.categories') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/master/customers">
                  <Users />
                  <span>{{ t('nav.customers') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>{{ t('nav.settings') }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/config">
                  <Settings />
                  <span>{{ t('nav.config') }}</span>
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
