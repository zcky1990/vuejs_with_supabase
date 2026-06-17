import type { Session } from '@supabase/supabase-js'
import type { Router } from 'vue-router'
import { clearAuthCookies, getCookie, setCookie } from './cookies'
import { supabase } from './supabase'

const GUEST_ROUTES = ['/login', '/sign-up'] as const

function isGuestRoute(path: string) {
  return GUEST_ROUTES.includes(path as (typeof GUEST_ROUTES)[number])
}

export const persistAuthSession = (session: Session) => {
  setCookie('_access_token', session.access_token)
  setCookie('_token_type', session.token_type)
  setCookie('_refresh_token', session.refresh_token)
  setCookie('_expires_in', String(session.expires_in))
  if (session.user.email) {
    setCookie('_user_email', session.user.email)
  }
}

export const validateOrRefreshSession = async (
  router: Router,
  currentPath = router.currentRoute.value.path,
): Promise<boolean> => {
  const accessToken = getCookie('_access_token')
  const refreshToken = getCookie('_refresh_token')

  if (!accessToken || !refreshToken) return false

  const supabaseClient = supabase()

  const logout = async () => {
    await supabaseClient.auth.signOut()
    clearAuthCookies()
    if (!isGuestRoute(currentPath)) {
      router.push('/login')
    }
  }

  const refresh = async () => {
    const { data, error } = await supabaseClient.auth.refreshSession({
      refresh_token: refreshToken,
    })
    if (error || !data.session) {
      await logout()
      return false
    }
    persistAuthSession(data.session)
    return true
  }

  const { data, error } = await supabaseClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (error || !data.session) {
    return refresh()
  }

  const { error: userError } = await supabaseClient.auth.getUser()
  if (userError) {
    return refresh()
  }

  if (data.session.access_token !== accessToken) {
    persistAuthSession(data.session)
  }

  return true
}
