import { supabase } from './supabase'
import { getCurrentUser } from './auth'
import { useLocaleStore } from '@/stores/useLocaleStore'
import type { UserRole } from '@/types/database'
import type { AppRole, Profile } from '@/types/database'

export async function getCurrentUserProfile() {
  const { user, error: userError } = await getCurrentUser()
  if (userError || !user) {
    return { profile: null, error: userError ?? { message: 'User not found' } }
  }

  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id, full_name, email, role, created_at, updated_at')
    .eq('id', user.id)
    .single()

  return { profile: data as Profile | null, error }
}

export async function getRoles() {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('roles')
    .select('code, sort_order')
    .order('sort_order', { ascending: true })

  return { roles: (data ?? []) as AppRole[], error }
}

export async function listProfiles() {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id, full_name, email, role, created_at, updated_at')
    .order('created_at', { ascending: true })

  return { profiles: (data ?? []) as Profile[], error }
}

export async function updateProfileRole(userId: string, role: UserRole) {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single()

  return { profile: data as Profile | null, error }
}

export async function createUserWithRole(input: {
  email: string
  password: string
  fullName: string
  role: UserRole
}) {
  const supabaseClient = supabase()

  const { data: currentSession } = await supabaseClient.auth.getSession()
  const adminSession = currentSession.session

  const { data, error } = await supabaseClient.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim(),
      },
    },
  })

  if (error) {
    if (adminSession) {
      await supabaseClient.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      })
    }
    return { userId: null, error }
  }

  const userId = data.user?.id ?? null
  if (userId) {
    await updateProfileRole(userId, input.role)
  }

  if (adminSession) {
    await supabaseClient.auth.setSession({
      access_token: adminSession.access_token,
      refresh_token: adminSession.refresh_token,
    })
  }

  return { userId, error: null }
}

export function getRoleLabelKey(role: UserRole) {
  return role === 'owner' ? 'role.owner' : 'role.staff'
}

export async function assertOwnerAction() {
  const { profile, error } = await getCurrentUserProfile()
  if (error || !profile) {
    return { ok: false, error: error ?? { message: useLocaleStore().translate('role.userRequired') } }
  }
  if (profile.role !== 'owner') {
    return { ok: false, error: { message: useLocaleStore().translate('role.ownerOnly') } }
  }
  return { ok: true, error: null }
}
