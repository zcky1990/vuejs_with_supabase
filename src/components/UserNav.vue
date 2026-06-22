<script setup lang="ts">
import { Check, ChevronsUpDown, GalleryVerticalEnd } from "@lucide/vue"

import { ref } from "vue"
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const props = defineProps<{
  email: string,
  menu: { title: string, url: string, icon: string, onClick: () => void }[]
}>()

</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
            <Avatar>
              <AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
              <AvatarFallback>{{ email.charAt(0) }}</AvatarFallback>
            </Avatar>
            <div class="flex flex-col gap-0.5 leading-none">
              <span class="font-bold">Welcome</span>
              <span class="font-medium">{{ email }}</span>
            </div>
            <ChevronsUpDown class="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-(--reka-dropdown-menu-trigger-width)" align="start">
          <DropdownMenuItem v-for="item in menu" :key="item.title" @select="item.onClick">
            {{ item.title }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
