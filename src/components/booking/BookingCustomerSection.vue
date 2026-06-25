<script setup lang="ts">
import { computed } from 'vue'
import { Phone } from '@lucide/vue'
import BookingGroupCard from '@/components/booking/BookingGroupCard.vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useI18n } from '@/composables/useI18n'
import type { BookingCustomerGroup, BookingNameSection } from '@/types/database'

const props = defineProps<{
  section: BookingNameSection
  showDate?: boolean
}>()

const emit = defineEmits<{
  viewDetail: [group: BookingCustomerGroup]
  confirm: [group: BookingCustomerGroup]
  checkIn: [group: BookingCustomerGroup]
  cancel: [group: BookingCustomerGroup]
}>()

const { t } = useI18n()

const displayName = computed(() => props.section.customerName || t('order.noName'))
const initials = computed(() => displayName.value.charAt(0).toUpperCase())
const isMultiReservation = computed(() => props.section.reservationCount > 1)
</script>

<template>
  <Card class="gap-0 overflow-hidden py-0">
    <CardHeader class="border-b px-4 py-4">
      <div class="flex items-center gap-3">
        <Avatar class="size-10">
          <AvatarFallback class="bg-primary/10 text-sm font-semibold text-primary">
            {{ initials }}
          </AvatarFallback>
        </Avatar>

        <div class="min-w-0 flex-1 space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <CardTitle class="truncate text-base">
              {{ displayName }}
            </CardTitle>
            <span
              v-if="isMultiReservation"
              class="inline-flex items-center rounded-md border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground"
            >
              {{ t('book.reservationCount', { count: section.reservationCount }) }}
            </span>
          </div>
          <CardDescription
            v-if="section.customerPhone"
            class="flex items-center gap-1.5"
          >
            <Phone class="size-3.5 shrink-0" />
            {{ section.customerPhone }}
          </CardDescription>
        </div>
      </div>
    </CardHeader>

    <CardContent class="p-0">
      <template
        v-for="(group, index) in section.groups"
        :key="group.key"
      >
        <Separator v-if="index > 0" />
        <BookingGroupCard
          :group="group"
          :show-date="showDate"
          @view-detail="emit('viewDetail', group)"
          @confirm="emit('confirm', group)"
          @check-in="emit('checkIn', group)"
          @cancel="emit('cancel', group)"
        />
      </template>
    </CardContent>
  </Card>
</template>
