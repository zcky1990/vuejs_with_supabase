import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import SignUpView from '@/views/SignUpView.vue'
import { validateOrRefreshSession } from '@/lib/auth'

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
  ],
})

router.beforeEach(async (to) => {
  const isGuestRoute = to.path === '/login' || to.path === '/sign-up'

  if (!isGuestRoute) {
    await validateOrRefreshSession(router, to.path)
    return true
  }

  const isAuthenticated = await validateOrRefreshSession(router, to.path)
  if (isAuthenticated) {
    return '/'
  }

  return true
})

export default router
