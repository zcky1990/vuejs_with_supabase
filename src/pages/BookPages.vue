<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, ArrowRight, CalendarDays, Minus, Plus, Trash2, Users } from '@lucide/vue'
import AddonSelectDialog from '@/components/transactions/AddonSelectDialog.vue'
import FloorPlanCanvas from '@/components/floor/FloorPlanCanvas.vue'
import OrderMenuPanel from '@/components/order/OrderMenuPanel.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useBookingCart } from '@/composables/useBookingCart'
import { useI18n } from '@/composables/useI18n'
import { formatShopDateTime, getShopDateString } from '@/lib/date'
import ApplicationLayout from '@/layouts/ApplicationLayout.vue'

const { t } = useI18n()

const {
  step,
  bookingDate,
  bookingTime,
  selectedTableIds,
  availableTables,
  bookedTables,
  floorCanvasTables,
  availableDiningTableIds,
  bookedDiningTableIds,
  slotTablesForList,
  hasFloorLayout,
  hasSelectableTables,
  selectedTables,
  totalSelectedSeats,
  selectedTableNumbersLabel,
  customerName,
  customerPhone,
  partySize,
  notes,
  cart,
  searchQuery,
  categoryFilter,
  isLoading,
  isSubmitting,
  isLoadingTables,
  bookingDefaults,
  maxBookingDate,
  scheduledAtIso,
  selectedTable,
  filteredMenuProducts,
  menuCategories,
  addonDialogOpen,
  pendingProduct,
  pendingProductAddons,
  pendingBundleIndex,
  pendingBundleTotal,
  totalAmount,
  formatPrice,
  getCartLineSubtotal,
  getMenuQuantity,
  incrementMenuQuantity,
  decrementMenuQuantity,
  addProductFromMenu,
  handleAddonConfirm,
  updateQuantity,
  removeFromCart,
  clearCart,
  goToStep,
  prevStep,
  toggleDiningTable,
  submitBooking,
} = useBookingCart()

const steps = [
  { id: 1, label: t('book.stepSchedule') },
  { id: 2, label: t('book.stepTable') },
  { id: 3, label: t('book.stepDetails') },
  { id: 4, label: t('book.stepMenu') },
]

const scheduleSummary = computed(() => formatShopDateTime(scheduledAtIso.value))
const minBookingDate = getShopDateString()
</script>

<template>
  <ApplicationLayout>
    <div class="w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">{{ t('book.title') }}</h1>
          <p class="text-sm text-muted-foreground">{{ t('book.subtitle') }}</p>
        </div>
        <Button variant="outline" size="sm" as-child>
          <RouterLink to="/">
            <ArrowLeft class="size-4" />
            {{ t('book.home') }}
          </RouterLink>
        </Button>
      </div>

      <div v-if="isLoading" class="rounded-xl border px-4 py-10 text-center text-muted-foreground">
        {{ t('book.loading') }}
      </div>

      <template v-else>
        <ol class="mb-8 flex flex-wrap gap-2">
          <li
            v-for="item in steps"
            :key="item.id"
            class="rounded-full border px-3 py-1 text-xs font-medium"
            :class="step === item.id ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground'"
          >
            {{ item.id }}. {{ item.label }}
          </li>
        </ol>

        <div v-if="step === 1" class="mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-lg">
                <CalendarDays class="size-5" />
                {{ t('book.stepSchedule') }}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel for="booking-date">{{ t('book.date') }}</FieldLabel>
                  <Input
                    id="booking-date"
                    v-model="bookingDate"
                    type="date"
                    :min="minBookingDate"
                    :max="maxBookingDate"
                  />
                </Field>
                <Field>
                  <FieldLabel for="booking-time">{{ t('book.time') }}</FieldLabel>
                  <Input id="booking-time" v-model="bookingTime" type="time" />
                  <p class="mt-1 text-xs text-muted-foreground">
                    {{ t('book.hoursHint', {
                      open: bookingDefaults.openTime.slice(0, 5),
                      close: bookingDefaults.closeTime.slice(0, 5),
                    }) }}
                  </p>
                </Field>
              </FieldGroup>
              <Button class="w-full" @click="goToStep(2)">
                {{ t('book.next') }}
                <ArrowRight class="size-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div v-else-if="step === 2" class="mx-auto max-w-5xl">
          <Card>
            <CardHeader>
              <CardTitle>{{ t('book.stepTable') }}</CardTitle>
              <p class="text-sm text-muted-foreground">{{ scheduleSummary }}</p>
              <p v-if="hasFloorLayout" class="text-sm text-muted-foreground">
                {{ t('book.floorPlanHintMulti') }}
              </p>
            </CardHeader>
            <CardContent class="space-y-4">
              <div v-if="isLoadingTables" class="text-sm text-muted-foreground">
                {{ t('book.loadingTables') }}
              </div>
              <template v-else>
                <div
                  v-if="!hasSelectableTables && !bookedTables.length"
                  class="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  {{ t('book.noTables') }}
                </div>

                <div
                  v-else-if="!hasSelectableTables && !hasFloorLayout"
                  class="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-6 text-center text-sm text-amber-800 dark:text-amber-300"
                >
                  {{ t('book.allTablesBooked') }}
                </div>

                <template v-else>
                  <p
                    v-if="!hasSelectableTables"
                    class="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-center text-sm text-amber-800 dark:text-amber-300"
                  >
                    {{ t('book.allTablesBooked') }}
                  </p>

                  <div v-if="hasFloorLayout" class="space-y-3">
                    <div class="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span class="inline-flex items-center gap-1.5">
                        <span class="size-3 rounded border-2 border-emerald-500 bg-emerald-500/15" />
                        {{ t('book.floorLegendAvailable') }}
                      </span>
                      <span class="inline-flex items-center gap-1.5">
                        <span class="size-3 rounded border-2 border-primary bg-primary/15 ring-1 ring-primary/30" />
                        {{ t('book.floorLegendSelected') }}
                      </span>
                      <span class="inline-flex items-center gap-1.5">
                        <span class="size-3 rounded border-2 border-amber-500 bg-amber-500/15" />
                        {{ t('book.floorLegendBooked') }}
                      </span>
                      <span class="inline-flex items-center gap-1.5">
                        <span class="size-3 rounded border-2 border-muted-foreground/30 bg-muted/40 opacity-60" />
                        {{ t('book.floorLegendUnavailable') }}
                      </span>
                    </div>

                    <FloorPlanCanvas
                      :tables="floorCanvasTables"
                      selectable
                      :selected-dining-table-ids="selectedTableIds"
                      :available-dining-table-ids="availableDiningTableIds"
                      :booked-dining-table-ids="bookedDiningTableIds"
                      @select-dining-table="toggleDiningTable"
                    />

                    <p v-if="selectedTables.length" class="text-center text-sm font-medium">
                      {{ t('book.tablesSelected', { count: selectedTables.length }) }}
                      · {{ selectedTableNumbersLabel }}
                      · {{ t('book.seatsTotal', { count: totalSelectedSeats }) }}
                    </p>
                  </div>

                  <div v-if="!hasFloorLayout && hasSelectableTables" class="grid gap-3 sm:grid-cols-2">
                    <button
                      v-for="{ table, status } in slotTablesForList"
                      :key="table.id"
                      type="button"
                      class="rounded-xl border p-4 text-left transition"
                      :class="status === 'booked'
                        ? 'cursor-not-allowed border-amber-500/40 bg-amber-500/5 opacity-80'
                        : selectedTableIds.includes(table.id)
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30 hover:border-primary'
                          : 'hover:border-primary'"
                      :disabled="status === 'booked'"
                      @click="toggleDiningTable(table.id)"
                    >
                      <p class="font-semibold">{{ t('book.tableNumber', { number: table.table_number }) }}</p>
                      <p class="mt-1 text-sm text-muted-foreground">
                        {{ t('book.seats', { count: table.seats }) }}
                        <span v-if="status === 'booked'" class="text-amber-700 dark:text-amber-300">
                          · {{ t('book.tableBooked') }}
                        </span>
                      </p>
                    </button>
                  </div>

                  <details v-else-if="hasFloorLayout" class="rounded-lg border">
                    <summary class="cursor-pointer px-4 py-3 text-sm font-medium">
                      {{ t('book.tableListToggle') }}
                    </summary>
                    <div class="grid gap-2 border-t p-3 sm:grid-cols-2">
                      <button
                        v-for="{ table, status } in slotTablesForList"
                        :key="table.id"
                        type="button"
                        class="rounded-lg border px-3 py-2 text-left text-sm transition"
                        :class="status === 'booked'
                          ? 'cursor-not-allowed border-amber-500/40 bg-amber-500/5 opacity-80'
                          : selectedTableIds.includes(table.id)
                            ? 'border-primary bg-primary/5 hover:border-primary'
                            : 'hover:border-primary'"
                        :disabled="status === 'booked'"
                        @click="toggleDiningTable(table.id)"
                      >
                        {{ t('book.tableNumber', { number: table.table_number }) }}
                        · {{ t('book.seats', { count: table.seats }) }}
                        <span v-if="status === 'booked'"> · {{ t('book.tableBooked') }}</span>
                      </button>
                    </div>
                  </details>
                </template>
              </template>

              <div class="flex gap-2">
                <Button variant="outline" class="flex-1" @click="prevStep">{{ t('book.back') }}</Button>
                <Button class="flex-1" :disabled="!selectedTableIds.length" @click="goToStep(3)">
                  {{ t('book.next') }}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div v-else-if="step === 3" class="mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-lg">
                <Users class="size-5" />
                {{ t('book.stepDetails') }}
              </CardTitle>
              <p class="text-sm text-muted-foreground">
                {{ scheduleSummary }}
                <span v-if="selectedTables.length"> · {{ selectedTableNumbersLabel }}</span>
              </p>
            </CardHeader>
            <CardContent class="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel for="customer-name">{{ t('book.customerName') }}</FieldLabel>
                  <Input id="customer-name" v-model="customerName" :placeholder="t('book.customerNamePh')" />
                </Field>
                <Field>
                  <FieldLabel for="customer-phone">{{ t('book.customerPhone') }}</FieldLabel>
                  <Input id="customer-phone" v-model="customerPhone" :placeholder="t('book.customerPhonePh')" />
                </Field>
                <Field>
                  <FieldLabel for="party-size">{{ t('book.partySize') }}</FieldLabel>
                  <Input
                    id="party-size"
                    v-model.number="partySize"
                    type="number"
                    min="1"
                    :max="totalSelectedSeats || 99"
                  />
                  <p v-if="selectedTables.length" class="mt-1 text-xs text-muted-foreground">
                    {{ t('book.partySizeMaxTotal', { count: totalSelectedSeats }) }}
                  </p>
                </Field>
                <Field>
                  <FieldLabel for="booking-notes">{{ t('book.notes') }}</FieldLabel>
                  <Input id="booking-notes" v-model="notes" :placeholder="t('book.notesPh')" />
                </Field>
              </FieldGroup>
              <div class="flex gap-2">
                <Button variant="outline" class="flex-1" @click="prevStep">{{ t('book.back') }}</Button>
                <Button class="flex-1" @click="goToStep(4)">{{ t('book.next') }}</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div v-else class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <OrderMenuPanel
            :products="filteredMenuProducts"
            :categories="menuCategories"
            :category-filter="categoryFilter"
            :search-query="searchQuery"
            :is-loading="false"
            :get-menu-quantity="getMenuQuantity"
            @update:search-query="searchQuery = $event"
            @update:category-filter="categoryFilter = $event"
            @add="addProductFromMenu"
            @increment-quantity="incrementMenuQuantity"
            @decrement-quantity="decrementMenuQuantity"
          />

          <aside class="lg:sticky lg:top-20 lg:self-start">
            <Card class="gap-0 py-0 shadow-sm">
              <CardHeader class="border-b px-5 py-4">
                <CardTitle class="text-lg">{{ t('book.summary') }}</CardTitle>
                <p class="text-sm text-muted-foreground">{{ scheduleSummary }}</p>
                <p v-if="selectedTables.length" class="text-sm text-muted-foreground">
                  {{ selectedTableNumbersLabel }}
                  · {{ t('book.guests', { count: partySize }) }}
                </p>
              </CardHeader>
              <CardContent class="space-y-5 px-5 py-5">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium">{{ t('order.orderItems') }}</p>
                  <Button v-if="cart.length" variant="ghost" size="sm" @click="clearCart">
                    {{ t('order.clear') }}
                  </Button>
                </div>

                <p v-if="!cart.length" class="text-sm text-muted-foreground">
                  {{ t('order.cartEmpty') }}
                </p>

                <ul v-else class="space-y-3">
                  <li
                    v-for="item in cart"
                    :key="item.lineKey"
                    class="flex items-start justify-between gap-3 text-sm"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="font-medium">{{ item.product.name }}</p>
                      <p v-if="item.addons.length" class="text-xs text-muted-foreground">
                        {{ item.addons.map((addon) => addon.product.name).join(', ') }}
                      </p>
                      <div class="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          class="size-7"
                          @click="updateQuantity(item.lineKey, item.quantity - 1)"
                        >
                          <Minus class="size-3" />
                        </Button>
                        <span class="w-6 text-center">{{ item.quantity }}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          class="size-7"
                          @click="updateQuantity(item.lineKey, item.quantity + 1)"
                        >
                          <Plus class="size-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          class="size-7 text-destructive"
                          @click="removeFromCart(item.lineKey)"
                        >
                          <Trash2 class="size-3" />
                        </Button>
                      </div>
                    </div>
                    <p class="shrink-0 font-medium">{{ formatPrice(getCartLineSubtotal(item)) }}</p>
                  </li>
                </ul>

                <Separator />

                <div class="flex items-center justify-between font-semibold">
                  <span>{{ t('common.total') }}</span>
                  <span>{{ formatPrice(totalAmount) }}</span>
                </div>

                <div class="flex gap-2">
                  <Button variant="outline" class="flex-1" @click="prevStep">{{ t('book.back') }}</Button>
                  <Button
                    class="flex-1"
                    :disabled="isSubmitting || !cart.length"
                    @click="submitBooking"
                  >
                    {{ isSubmitting ? t('book.submitting') : t('book.submit') }}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </template>

      <AddonSelectDialog
        v-model:open="addonDialogOpen"
        :product="pendingProduct"
        :addons="pendingProductAddons"
        :bundle-index="pendingBundleIndex"
        :bundle-total="pendingBundleTotal"
        @confirm="handleAddonConfirm"
      />
    </div>
  </ApplicationLayout>
</template>
