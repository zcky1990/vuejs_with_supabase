<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Pencil, Plus, Trash2 } from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import TableFormDialog from '@/components/masterdata/TableFormDialog.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useI18n } from '@/composables/useI18n'
import { usePagination } from '@/composables/usePagination'
import { useRoleStore } from '@/stores/useRoleStore'
import { deleteDiningTable, getDiningTablesWithAvailability } from '@/lib/table'
import { useAlertStore } from '@/stores/useAlertStore'
import type { DiningTableWithAvailability, TableAvailabilityStatus } from '@/types/database'

type StatusFilter = 'all' | 'active' | 'inactive'
type AvailabilityFilter = 'all' | TableAvailabilityStatus

const { t } = useI18n()
const roleStore = useRoleStore()
const alertStore = useAlertStore()
const tables = ref<DiningTableWithAvailability[]>([])
const isLoading = ref(true)
const dialogOpen = ref(false)
const selectedTable = ref<DiningTableWithAvailability | null>(null)
const searchQuery = ref('')
const statusFilter = ref<StatusFilter>('all')
const availabilityFilter = ref<AvailabilityFilter>('all')

const availabilityClass: Record<TableAvailabilityStatus, string> = {
  available: 'text-emerald-600 dark:text-emerald-400',
  occupied: 'text-amber-600 dark:text-amber-400',
  reserved: 'text-cyan-600 dark:text-cyan-400',
  inactive: 'text-muted-foreground',
}

const filteredTables = computed(() => {
  let result = tables.value

  if (statusFilter.value === 'active') {
    result = result.filter((table) => table.is_active)
  } else if (statusFilter.value === 'inactive') {
    result = result.filter((table) => !table.is_active)
  }

  if (availabilityFilter.value !== 'all') {
    result = result.filter((table) => table.availability_status === availabilityFilter.value)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter((table) => table.table_number.toLowerCase().includes(query))
  }

  return result
})

const {
  paginatedItems: paginatedTables,
  currentPage,
  pageSize,
  totalCount,
  totalPages,
  paginationFrom,
  paginationTo,
  goToPage,
} = usePagination(filteredTables, [searchQuery, statusFilter, availabilityFilter])

function availabilityLabel(status: TableAvailabilityStatus) {
  if (status === 'available') return t('master.availabilityAvailable')
  if (status === 'occupied') return t('master.availabilityOccupied')
  if (status === 'reserved') return t('master.availabilityReserved')
  return t('master.availabilityInactive')
}

async function loadTables() {
  isLoading.value = true
  const { tables: data, error } = await getDiningTablesWithAvailability()
  isLoading.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), error.message, 'error')
    return
  }

  tables.value = data ?? []
}

function openCreateDialog() {
  selectedTable.value = null
  dialogOpen.value = true
}

function openEditDialog(table: DiningTableWithAvailability) {
  selectedTable.value = table
  dialogOpen.value = true
}

async function handleDelete(table: DiningTableWithAvailability) {
  if (!confirm(t('master.deleteDiningTableConfirm', { number: table.table_number }))) return

  const { error } = await deleteDiningTable(table.id)
  if (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === 'TABLE_IN_FLOOR_PLAN') {
      alertStore.showAlert(t('alert.error'), t('master.diningTableDeleteFloorPlan'), 'error')
      return
    }
    if (message === 'TABLE_OCCUPIED') {
      alertStore.showAlert(t('alert.error'), t('master.diningTableDeleteOccupied'), 'error')
      return
    }
    alertStore.showAlert(t('alert.error'), message, 'error')
    return
  }

  alertStore.showAlert(t('alert.success'), t('master.diningTableDeleted'), 'success')
  await loadTables()
}

onMounted(loadTables)
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6 p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">{{ t('master.diningTableTitle') }}</h1>
          <p class="text-sm text-muted-foreground">{{ t('master.diningTableSubtitle') }}</p>
        </div>
        <Button v-if="roleStore.isOwner" @click="openCreateDialog">
          <Plus class="size-4" />
          {{ t('master.addDiningTable') }}
        </Button>
      </div>

      <p v-if="roleStore.isStaff" class="text-sm text-muted-foreground">
        {{ t('role.readOnlyMaster') }}
      </p>

      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          v-model="searchQuery"
          :placeholder="t('master.searchDiningTable')"
          class="max-w-sm"
        />
        <Select v-model="statusFilter">
          <SelectTrigger class="w-full sm:w-[180px]">
            <SelectValue :placeholder="t('status.allStatus')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t('status.allStatus') }}</SelectItem>
            <SelectItem value="active">{{ t('common.active') }}</SelectItem>
            <SelectItem value="inactive">{{ t('common.inactive') }}</SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="availabilityFilter">
          <SelectTrigger class="w-full sm:w-[200px]">
            <SelectValue :placeholder="t('master.allAvailability')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t('master.allAvailability') }}</SelectItem>
            <SelectItem value="available">{{ t('master.availabilityAvailable') }}</SelectItem>
            <SelectItem value="occupied">{{ t('master.availabilityOccupied') }}</SelectItem>
            <SelectItem value="reserved">{{ t('master.availabilityReserved') }}</SelectItem>
            <SelectItem value="inactive">{{ t('master.availabilityInactive') }}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t('master.diningTableNumber') }}</TableHead>
              <TableHead>{{ t('master.diningTableSeats') }}</TableHead>
              <TableHead>{{ t('common.status') }}</TableHead>
              <TableHead>{{ t('master.availability') }}</TableHead>
              <TableHead v-if="roleStore.isOwner" class="text-right">{{ t('common.actions') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading">
              <TableCell :colspan="roleStore.isOwner ? 5 : 4" class="text-center text-muted-foreground">
                {{ t('common.loading') }}
              </TableCell>
            </TableRow>
            <TableRow v-else-if="!filteredTables.length">
              <TableCell :colspan="roleStore.isOwner ? 5 : 4" class="text-center text-muted-foreground">
                {{ tables.length ? t('master.noDiningTableFilterMatch') : t('master.noDiningTable') }}
              </TableCell>
            </TableRow>
            <TableRow v-for="table in paginatedTables" :key="table.id">
              <TableCell class="font-medium">{{ table.table_number }}</TableCell>
              <TableCell>{{ table.seats }}</TableCell>
              <TableCell>{{ table.is_active ? t('common.active') : t('common.inactive') }}</TableCell>
              <TableCell :class="availabilityClass[table.availability_status]">
                {{ availabilityLabel(table.availability_status) }}
              </TableCell>
              <TableCell v-if="roleStore.isOwner" class="text-right">
                <div class="flex justify-end gap-2">
                  <Button size="icon-sm" variant="outline" @click="openEditDialog(table)">
                    <Pencil class="size-4" />
                  </Button>
                  <Button size="icon-sm" variant="destructive" @click="handleDelete(table)">
                    <Trash2 class="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <TablePagination
          v-if="!isLoading && totalCount > 0"
          :from="paginationFrom"
          :to="paginationTo"
          :total="totalCount"
          :current-page="currentPage"
          :total-pages="totalPages"
          :page-size="pageSize"
          @update:page-size="pageSize = $event"
          @previous="goToPage(currentPage - 1)"
          @next="goToPage(currentPage + 1)"
        />
      </div>

      <TableFormDialog
        v-if="roleStore.isOwner"
        v-model:open="dialogOpen"
        :table="selectedTable"
        @saved="loadTables"
      />
    </div>
  </DashboardLayout>
</template>
