import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import SignUpView from '@/views/SignUpView.vue'
import { validateOrRefreshSession } from '@/lib/auth'
import DashboardView from '@/views/DashboardView.vue'

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
  ],
})

router.beforeEach(async (to) => {
  if (to.path === '/') {
    return true
  }

  const isGuestRoute = to.path === '/login' || to.path === '/sign-up'

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
