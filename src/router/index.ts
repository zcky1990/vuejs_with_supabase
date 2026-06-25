import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import HomeView from '@/pages/HomePages.vue'
import LoginView from '@/pages/LoginPages.vue'
import SignUpView from '@/pages/SignUpPages.vue'
import { validateOrRefreshSession } from '@/lib/auth'
import { canAccessPath } from '@/lib/permissions'
import { useRoleStore } from '@/stores/useRoleStore'
import DashboardView from '@/pages/DashboardPages.vue'
import NotFoundView from '@/pages/NotFoundPages.vue'
import ProductMasterPages from '@/pages/ProductMasterPages.vue'
import CustomerMasterPages from '@/pages/CustomerMasterPages.vue'
import CategoryMasterPages from '@/pages/CategoryMasterPages.vue'
import TableMasterPages from '@/pages/TableMasterPages.vue'
import TransactionPages from '@/pages/TransactionPages.vue'
import TransactionListPages from '@/pages/TransactionListPages.vue'
import OpenTablesPages from '@/pages/OpenTablesPages.vue'
import ConfigPages from '@/pages/ConfigPages.vue'
import QueuePages from '@/pages/QueuePages.vue'
import QueueDisplayPages from '@/pages/QueueDisplayPages.vue'
import RestockPages from '@/pages/RestockPages.vue'
import StockOpnamePages from '@/pages/StockOpnamePages.vue'
import FloorPlanPages from '@/pages/FloorPlanPages.vue'
import FloorPlanEditorPages from '@/pages/FloorPlanEditorPages.vue'
import FloorPlanDisplayPages from '@/pages/FloorPlanDisplayPages.vue'
import AnalyticsPages from '@/pages/AnalyticsPages.vue'
import ShiftPages from '@/pages/ShiftPages.vue'
import OrderPages from '@/pages/OrderPages.vue'
import OrderSuccessPages from '@/pages/OrderSuccessPages.vue'
import BookPages from '@/pages/BookPages.vue'
import BookingSuccessPages from '@/pages/BookingSuccessPages.vue'
import BookingListPages from '@/pages/BookingListPages.vue'
import PreOrderInboxPages from '@/pages/PreOrderInboxPages.vue'
import UserRoleMasterPages from '@/pages/UserRoleMasterPages.vue'
import ProfilePages from '@/pages/ProfilePages.vue'

function createAppRouterHistory() {
  if (import.meta.env.VITE_ROUTER_MODE === 'hash') {
    return createWebHashHistory(import.meta.env.BASE_URL)
  }

  return createWebHistory(import.meta.env.BASE_URL)
}

const router = createRouter({
  history: createAppRouterHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/sign-up',
      name: 'sign-up',
      component: SignUpView,
    },
    {
      path: '/book',
      name: 'book',
      component: BookPages,
    },
    {
      path: '/book/success',
      name: 'book-success',
      component: BookingSuccessPages,
    },
    {
      path: '/order',
      name: 'order',
      component: OrderPages,
    },
    {
      path: '/order/success',
      name: 'order-success',
      component: OrderSuccessPages,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfilePages,
    },
    {
      path: '/master/products',
      name: 'master-products',
      component: ProductMasterPages,
    },
    {
      path: '/master/customers',
      name: 'master-customers',
      component: CustomerMasterPages,
    },
    {
      path: '/master/users',
      name: 'master-users',
      component: UserRoleMasterPages,
      meta: { roles: ['owner'] },
    },
    {
      path: '/master/categories',
      name: 'master-categories',
      component: CategoryMasterPages,
    },
    {
      path: '/master/tables',
      name: 'master-tables',
      component: TableMasterPages,
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: TransactionPages,
    },
    {
      path: '/transactions/list',
      name: 'transactions-list',
      component: TransactionListPages,
    },
    {
      path: '/transactions/open',
      name: 'transactions-open',
      component: OpenTablesPages,
    },
    {
      path: '/queue',
      name: 'queue',
      component: QueuePages,
    },
    {
      path: '/floor-plan',
      name: 'floor-plan',
      component: FloorPlanPages,
    },
    {
      path: '/floor-plan/edit',
      name: 'floor-plan-edit',
      component: FloorPlanEditorPages,
      meta: { roles: ['owner'] },
    },
    {
      path: '/floor-plan/display',
      name: 'floor-plan-display',
      component: FloorPlanDisplayPages,
    },
    {
      path: '/queue/display',
      name: 'queue-display',
      component: QueueDisplayPages,
    },
    {
      path: '/stock/restock',
      name: 'stock-restock',
      component: RestockPages,
      meta: { roles: ['owner'] },
    },
    {
      path: '/stock/opname',
      name: 'stock-opname',
      component: StockOpnamePages,
      meta: { roles: ['owner'] },
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: AnalyticsPages,
      meta: { roles: ['owner'] },
    },
    {
      path: '/shifts',
      name: 'shifts',
      component: ShiftPages,
    },
    {
      path: '/config',
      name: 'config',
      component: ConfigPages,
      meta: { roles: ['owner'] },
    },
    {
      path: '/orders/inbox',
      name: 'orders-inbox',
      component: PreOrderInboxPages,
    },
    {
      path: '/bookings',
      name: 'bookings',
      component: BookingListPages,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.name === 'not-found') {
    return true
  }

  if (to.path === '/' || to.path === '/order' || to.path === '/order/success' || to.path === '/book' || to.path === '/book/success') {
    return true
  }

  const isGuestRoute = to.path === '/login'

  if (to.path === '/queue/display' || to.path === '/floor-plan/display') {
    return true
  }

  if (isGuestRoute) {
    const isAuthenticated = await validateOrRefreshSession(router, to.path)
    if (isAuthenticated) {
      return '/'
    }
    return true
  }

  const isAuthenticated = await validateOrRefreshSession(router, to.path)
  if (!isAuthenticated) {
    return '/login'
  }

  const roleStore = useRoleStore()
  await roleStore.loadRole()

  if (!canAccessPath(to.path, roleStore.role)) {
    return '/dashboard'
  }

  return true
})

export default router
