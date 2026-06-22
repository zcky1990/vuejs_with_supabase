import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/pages/HomePages.vue'
import LoginView from '@/pages/LoginPages.vue'
import SignUpView from '@/pages/SignUpPages.vue'
import { validateOrRefreshSession } from '@/lib/auth'
import DashboardView from '@/pages/DashboardPages.vue'
import NotFoundView from '@/pages/NotFoundPages.vue'
import ProductMasterPages from '@/pages/ProductMasterPages.vue'
import CustomerMasterPages from '@/pages/CustomerMasterPages.vue'
import TransactionPages from '@/pages/TransactionPages.vue'
import TransactionListPages from '@/pages/TransactionListPages.vue'
import ConfigPages from '@/pages/ConfigPages.vue'
import QueuePages from '@/pages/QueuePages.vue'
import RestockPages from '@/pages/RestockPages.vue'
import AnalyticsPages from '@/pages/AnalyticsPages.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
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
      path: '/queue',
      name: 'queue',
      component: QueuePages,
    },
    {
      path: '/stock/restock',
      name: 'stock-restock',
      component: RestockPages,
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: AnalyticsPages,
    },
    {
      path: '/config',
      name: 'config',
      component: ConfigPages,
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

  if (to.path === '/') {
    return true
  }

  const isGuestRoute = to.path === '/login' 

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

  return true
})

export default router
