<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { History, Pencil, Plus, Trash2 } from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import CustomerFormDialog from '@/components/masterdata/CustomerFormDialog.vue'
import CustomerPointHistoryDialog from '@/components/masterdata/CustomerPointHistoryDialog.vue'
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
import { deleteCustomer, getCustomers } from '@/lib/customer'
import { useAlertStore } from '@/stores/useAlertStore'
import { WALK_IN_CUSTOMER_NAME } from '@/types/database'
import type { Customer } from '@/types/database'

type StatusFilter = 'all' | 'active' | 'inactive'

const { t } = useI18n()
const roleStore = useRoleStore()
const alertStore = useAlertStore()
const customers = ref<Customer[]>([])
const isLoading = ref(true)
const dialogOpen = ref(false)
const historyDialogOpen = ref(false)
const selectedCustomer = ref<Customer | null>(null)
const searchQuery = ref('')
const statusFilter = ref<StatusFilter>('all')

const filteredCustomers = computed(() => {
  let result = customers.value

  if (statusFilter.value === 'active') {
    result = result.filter((customer) => customer.is_active)
  } else if (statusFilter.value === 'inactive') {
    result = result.filter((customer) => !customer.is_active)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter((customer) => {
      const name = customer.name.toLowerCase()
      const email = customer.email?.toLowerCase() ?? ''
      const phone = customer.phone?.toLowerCase() ?? ''
      const address = customer.address?.toLowerCase() ?? ''
      const notes = customer.notes?.toLowerCase() ?? ''
      return name.includes(query)
        || email.includes(query)
        || phone.includes(query)
        || address.includes(query)
        || notes.includes(query)
    })
  }

  return result
})

const {
  paginatedItems: paginatedCustomers,
  currentPage,
  pageSize,
  totalCount,
  totalPages,
  paginationFrom,
  paginationTo,
  goToPage,
} = usePagination(filteredCustomers, [searchQuery, statusFilter])

function displayCustomerName(name: string) {
  if (name === WALK_IN_CUSTOMER_NAME) return t('common.walkIn')
  return name
}

async function loadCustomers() {
  isLoading.value = true
  const { customers: data, error } = await getCustomers()
  isLoading.value = false

  if (error) {
    alertStore.showAlert(t('alert.error'), error.message, 'error')
    return
  }

  customers.value = data ?? []
}

function openCreateDialog() {
  selectedCustomer.value = null
  dialogOpen.value = true
}

function openEditDialog(customer: Customer) {
  selectedCustomer.value = customer
  dialogOpen.value = true
}

function openHistoryDialog(customer: Customer) {
  selectedCustomer.value = customer
  historyDialogOpen.value = true
}

async function handleDelete(customer: Customer) {
  if (!confirm(t('master.deleteCustomerConfirm', { name: customer.name }))) return

  const { error } = await deleteCustomer(customer.id)
  if (error) {
    alertStore.showAlert(t('alert.error'), error.message, 'error')
    return
  }

  alertStore.showAlert(t('alert.success'), t('master.customerDeleted'), 'success')
  await loadCustomers()
}

onMounted(loadCustomers)
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6 p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">{{ t('master.customerTitle') }}</h1>
          <p class="text-sm text-muted-foreground">{{ t('master.customerSubtitle') }}</p>
        </div>
        <Button v-if="roleStore.isOwner" @click="openCreateDialog">
          <Plus class="size-4" />
          {{ t('master.addCustomer') }}
        </Button>
      </div>

      <p v-if="roleStore.isStaff" class="text-sm text-muted-foreground">
        {{ t('role.readOnlyMaster') }}
      </p>

      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          v-model="searchQuery"
          :placeholder="t('master.searchCustomer')"
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
      </div>

      <div class="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t('master.name') }}</TableHead>
              <TableHead>{{ t('master.email') }}</TableHead>
              <TableHead>{{ t('master.phone') }}</TableHead>
              <TableHead>{{ t('master.address') }}</TableHead>
              <TableHead>{{ t('loyalty.member') }}</TableHead>
              <TableHead>{{ t('loyalty.points') }}</TableHead>
              <TableHead>{{ t('common.status') }}</TableHead>
              <TableHead v-if="roleStore.isOwner" class="text-right">{{ t('common.actions') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading">
              <TableCell :colspan="roleStore.isOwner ? 8 : 7" class="text-center text-muted-foreground">
                {{ t('common.loading') }}
              </TableCell>
            </TableRow>
            <TableRow v-else-if="!filteredCustomers.length">
              <TableCell :colspan="roleStore.isOwner ? 8 : 7" class="text-center text-muted-foreground">
                {{ customers.length ? t('master.noCustomerFilterMatch') : t('master.noCustomer') }}
              </TableCell>
            </TableRow>
            <TableRow v-for="customer in paginatedCustomers" :key="customer.id">
              <TableCell class="font-medium">{{ displayCustomerName(customer.name) }}</TableCell>
              <TableCell>{{ customer.email || '-' }}</TableCell>
              <TableCell>{{ customer.phone || '-' }}</TableCell>
              <TableCell>{{ customer.address || '-' }}</TableCell>
              <TableCell>{{ customer.is_member ? t('loyalty.member') : '-' }}</TableCell>
              <TableCell>{{ customer.is_member ? customer.loyalty_points : '-' }}</TableCell>
              <TableCell>{{ customer.is_active ? t('common.active') : t('common.inactive') }}</TableCell>
              <TableCell v-if="roleStore.isOwner" class="text-right">
                <div class="flex justify-end gap-2">
                  <Button
                    v-if="customer.is_member"
                    size="icon-sm"
                    variant="outline"
                    @click="openHistoryDialog(customer)"
                  >
                    <History class="size-4" />
                  </Button>
                  <Button size="icon-sm" variant="outline" @click="openEditDialog(customer)">
                    <Pencil class="size-4" />
                  </Button>
                  <Button size="icon-sm" variant="destructive" @click="handleDelete(customer)">
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

      <CustomerFormDialog
        v-if="roleStore.isOwner"
        v-model:open="dialogOpen"
        :customer="selectedCustomer"
        @saved="loadCustomers"
      />

      <CustomerPointHistoryDialog
        v-model:open="historyDialogOpen"
        :customer="selectedCustomer"
      />
    </div>
  </DashboardLayout>
</template>
