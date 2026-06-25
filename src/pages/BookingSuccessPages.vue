<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CalendarCheck, CheckCircle2, UtensilsCrossed } from '@lucide/vue'
import ApplicationLayout from '@/layouts/ApplicationLayout.vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useI18n } from '@/composables/useI18n'
import {
  clearBookingSuccessPayload,
  readBookingSuccessPayload,
  type BookingSuccessPayload,
} from '@/lib/booking-success'
import { formatShopDateTime } from '@/lib/date'
import { formatPrice } from '@/lib/format'

const { t } = useI18n()
const router = useRouter()

const booking = ref<BookingSuccessPayload | null>(null)

onMounted(() => {
  const payload = readBookingSuccessPayload()
  if (!payload) {
    router.replace('/book')
    return
  }

  booking.value = payload
})

function handleNewBooking() {
  clearBookingSuccessPayload()
  router.push('/book')
}

function handleHome() {
  clearBookingSuccessPayload()
  router.push('/')
}
</script>

<template>
  <ApplicationLayout>
    <div class="flex min-h-[calc(100svh-4rem)] w-full items-center justify-center px-4 py-10">
      <Card v-if="booking" class="w-full max-w-lg text-center">
        <CardHeader class="items-center space-y-4 pb-2">
          <div class="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 class="size-9" />
          </div>
          <div class="space-y-1">
            <CardTitle class="text-2xl">{{ t('book.successTitle') }}</CardTitle>
            <CardDescription>{{ t('book.successDesc') }}</CardDescription>
          </div>
        </CardHeader>

        <CardContent class="space-y-6">
          <div class="rounded-xl border bg-muted/40 px-6 py-8 text-left">
            <p class="text-sm text-muted-foreground">{{ t('book.successTables') }}</p>
            <p class="mt-1 text-3xl font-bold tracking-tight">
              {{ booking.tableNumbers }}
            </p>
            <p class="mt-4 flex items-center gap-2 text-sm">
              <CalendarCheck class="size-4 text-muted-foreground" />
              {{ formatShopDateTime(booking.scheduledAt) }}
            </p>
            <p class="mt-2 text-sm text-muted-foreground">
              {{ t('book.guests', { count: booking.partySize }) }}
            </p>
            <p class="mt-4 text-sm text-muted-foreground">
              {{ t('book.successTotal') }}:
              <span class="font-semibold text-foreground">{{ formatPrice(booking.totalAmount) }}</span>
            </p>
            <p v-if="booking.status === 'pending'" class="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-300">
              {{ t('book.successPending') }}
            </p>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row">
            <Button class="flex-1" @click="handleNewBooking">
              <UtensilsCrossed class="size-4" />
              {{ t('book.successNew') }}
            </Button>
            <Button class="flex-1" variant="outline" @click="handleHome">
              {{ t('book.successHome') }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </ApplicationLayout>
</template>
