<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronsUpDown } from '@lucide/vue'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useI18n } from '@/composables/useI18n'

interface MenuItem {
  title: string
  url?: string
  icon?: Component
  onClick?: () => void
}

interface MenuGroup {
  group: string
  items: MenuItem[]
}

interface MenuProps {
  email: string
  avatarUrl?: string | null
  menu: MenuGroup[]
}

const props = defineProps<MenuProps>()
const { t } = useI18n()
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar>
              <AvatarImage v-if="props.avatarUrl" :src="props.avatarUrl" :alt="props.email" />
              <AvatarFallback>{{ props.email.charAt(0).toUpperCase() }}</AvatarFallback>
            </Avatar>
            <div class="flex flex-col gap-0.5 leading-none">
              <span class="font-bold">{{ t('userNav.welcome') }}</span>
              <span class="font-medium">{{ props.email }}</span>
            </div>
            <ChevronsUpDown class="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-(--reka-dropdown-menu-trigger-width)" align="start">
          <template v-for="(menuGroup, index) in props.menu" :key="menuGroup.group">
            <DropdownMenuSeparator v-if="index > 0" />
            <DropdownMenuLabel>{{ menuGroup.group }}</DropdownMenuLabel>
            <DropdownMenuItem
              v-for="menuItem in menuGroup.items"
              :key="menuItem.title"
              @select="menuItem.onClick?.()"
            >
              <component :is="menuItem.icon" v-if="menuItem.icon" class="mr-2 h-4 w-4" />
              {{ menuItem.title }}
            </DropdownMenuItem>
          </template>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
