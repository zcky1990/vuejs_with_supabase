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

import { clearAuthCookies } from '@/lib/cookies'
import { getCurrentUser } from '@/lib/auth'
import { canAccessPath } from '@/lib/permissions'
import { useRoleStore } from '@/stores/useRoleStore'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { BarChart3, CalendarDays, ClipboardCheck, ClipboardList, Inbox, LayoutDashboard, LayoutGrid, List, LogOut, Monitor, Package, PackagePlus, Receipt, Settings, Shield, Tags, User, Users, UtensilsCrossed, Wallet } from '@lucide/vue'

const userEmail = ref<string>('')
const userAvatar = ref<string | null>(null)
const router = useRouter()
const roleStore = useRoleStore()
const { t, locale } = useI18n()
const props = defineProps<SidebarProps>()

function canShow(path: string) {
  return canAccessPath(path, roleStore.role)
}

async function loadUser() {
  const { user } = await getCurrentUser()
  userEmail.value = user?.email ?? ''
  userAvatar.value = user?.avatarUrl ?? null
}

async function handleLogout() {
  clearAuthCookies()
  roleStore.clear()
  router.push('/login')
}

const data = computed(() => {
  return {
  email: userEmail.value,
  menu: [
    {
      group: t('nav.account'),
      items: [
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
          onClick: handleLogout,
        },
      ],
    },
  ],
  }
})

onMounted(() => {
  roleStore.loadRole()
  loadUser()
  window.addEventListener('user-avatar-changed', loadUser)
})

onUnmounted(() => {
  window.removeEventListener('user-avatar-changed', loadUser)
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
            <SidebarMenuItem v-if="canShow('/dashboard')">
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
            <SidebarMenuItem v-if="canShow('/transactions')">
              <SidebarMenuButton as-child>
                <RouterLink to="/transactions">
                  <Receipt />
                  <span>{{ t('nav.createTransaction') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="canShow('/transactions/list')">
              <SidebarMenuButton as-child>
                <RouterLink to="/transactions/list">
                  <List />
                  <span>{{ t('nav.transactionList') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="canShow('/transactions/open')">
              <SidebarMenuButton as-child>
                <RouterLink to="/transactions/open">
                  <UtensilsCrossed />
                  <span>{{ t('nav.openTables') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="canShow('/orders/inbox')">
              <SidebarMenuButton as-child>
                <RouterLink to="/orders/inbox">
                  <Inbox />
                  <span>{{ t('nav.orderInbox') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="canShow('/bookings')">
              <SidebarMenuButton as-child>
                <RouterLink to="/bookings">
                  <CalendarDays />
                  <span>{{ t('nav.bookings') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="canShow('/queue')">
              <SidebarMenuButton as-child>
                <RouterLink to="/queue">
                  <ClipboardList />
                  <span>{{ t('nav.queue') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="canShow('/queue')">
              <SidebarMenuButton as-child>
                <RouterLink to="/queue/display" target="_blank">
                  <Monitor />
                  <span>{{ t('nav.queueDisplay') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="canShow('/floor-plan')">
              <SidebarMenuButton as-child>
                <RouterLink to="/floor-plan">
                  <LayoutGrid />
                  <span>{{ t('nav.floorPlan') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="canShow('/stock/restock')">
              <SidebarMenuButton as-child>
                <RouterLink to="/stock/restock">
                  <PackagePlus />
                  <span>{{ t('nav.restock') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="canShow('/stock/opname')">
              <SidebarMenuButton as-child>
                <RouterLink to="/stock/opname">
                  <ClipboardCheck />
                  <span>{{ t('nav.opname') }}</span>
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
            <SidebarMenuItem v-if="canShow('/analytics')">
              <SidebarMenuButton as-child>
                <RouterLink to="/analytics">
                  <BarChart3 />
                  <span>{{ t('nav.analytics') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="canShow('/shifts')">
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
            <SidebarMenuItem v-if="canShow('/master/products')">
              <SidebarMenuButton as-child>
                <RouterLink to="/master/products">
                  <Package />
                  <span>{{ t('nav.products') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="canShow('/master/categories')">
              <SidebarMenuButton as-child>
                <RouterLink to="/master/categories">
                  <Tags />
                  <span>{{ t('nav.categories') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="canShow('/master/tables')">
              <SidebarMenuButton as-child>
                <RouterLink to="/master/tables">
                  <UtensilsCrossed />
                  <span>{{ t('nav.diningTables') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="canShow('/master/customers')">
              <SidebarMenuButton as-child>
                <RouterLink to="/master/customers">
                  <Users />
                  <span>{{ t('nav.customers') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="canShow('/master/users')">
              <SidebarMenuButton as-child>
                <RouterLink to="/master/users">
                  <Shield />
                  <span>{{ t('nav.users') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup v-if="canShow('/config')">
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
