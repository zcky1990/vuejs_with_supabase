import type { Router } from 'vue-router'
import { clearAuthCookies } from './cookies'
import { supabase } from './supabase'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { isWebpImageFile } from './product'
import { loginSchema, signUpSchema, passwordUpdateSchema, profileUpdateSchema } from '@/schema/schema'

export const isGuestRoute = (path: string) => {
  const GUEST_ROUTES = ['/login', '/sign-up'] as const
  return GUEST_ROUTES.includes(path as (typeof GUEST_ROUTES)[number])
}

export const login = async ({ email, password }: { email: string, password: string }) => {
  const validatedLogin = loginSchema().safeParse({ email, password })
  if (!validatedLogin.success) {
    return { error: validatedLogin.error.flatten().fieldErrors }
  }
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient.auth.signInWithPassword(validatedLogin.data)
  return { data, error: error ? error.message : null }
}

export const signUp = async ({ name, email, password, confirmPassword }: { name: string, email: string, password: string, confirmPassword: string }) => {
  const validatedSignUp = signUpSchema().safeParse({ name, email, password, confirmPassword })
  if (!validatedSignUp.success) {
    return { error: validatedSignUp.error.flatten().fieldErrors }
  }
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient.auth.signUp({
    email: validatedSignUp.data.email,
    password: validatedSignUp.data.password,
    options: {
      data: {
        full_name: validatedSignUp.data.name,
      },
    },
  })
  return { data, error: error ? error.message : null }
}

export const validateOrRefreshSession = async (
  router: Router,
  currentPath = router.currentRoute.value.path,
): Promise<boolean> => {
  const supabaseClient = supabase()
  const { data: { session } } = await supabaseClient.auth.getSession()

  if (!session) {
    clearAuthCookies()
    return false
  }

  const { error: userError } = await supabaseClient.auth.getUser()
  if (userError) {
    const { data: refreshed, error: refreshError } = await supabaseClient.auth.refreshSession({
      refresh_token: session.refresh_token,
    })
    if (refreshError || !refreshed.session) {
      await supabaseClient.auth.signOut()
      clearAuthCookies()
      if (!isGuestRoute(currentPath)) {
        router.push('/login')
      }
      return false
    }
    return true
  }

  return true
}

export type UserProfile = {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  createdAt: string
  lastSignInAt: string | null
}

const AVATAR_BUCKET = 'shop-assets'
const AVATAR_MAX_BYTES = 5 * 1024 * 1024
const LEGACY_AVATAR_EXTENSIONS = ['png', 'jpg', 'jpeg'] as const

function getAvatarStoragePath(userId: string) {
  return `avatars/${userId}.webp`
}

function getAvatarPathFromUrl(imageUrl: string | null) {
  if (!imageUrl) return null

  try {
    const pathname = new URL(imageUrl).pathname
    const marker = '/avatars/'
    const index = pathname.indexOf(marker)
    if (index === -1) return null

    return pathname.slice(index + 1)
  } catch {
    return null
  }
}

async function removeAvatarFiles(userId: string) {
  const supabaseClient = supabase()
  const paths = [
    getAvatarStoragePath(userId),
    ...LEGACY_AVATAR_EXTENSIONS.map((extension) => `avatars/${userId}.${extension}`),
  ]
  const { error } = await supabaseClient.storage.from(AVATAR_BUCKET).remove(paths)
  return { error }
}

export async function uploadAvatarImage(file: File, userId: string) {
  if (!isWebpImageFile(file)) {
    return { url: null, error: { message: useLocaleStore().translate('master.imageWebpRequired') } }
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return { url: null, error: { message: useLocaleStore().translate('config.imageMaxSize') } }
  }

  const path = getAvatarStoragePath(userId)
  const supabaseClient = supabase()
  await removeAvatarFiles(userId)

  const { error: uploadError } = await supabaseClient.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: 'image/webp' })

  if (uploadError) {
    return { url: null, error: uploadError }
  }

  const { data } = supabaseClient.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  const avatarUrl = `${data.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabaseClient.auth.updateUser({
    data: { avatar_url: avatarUrl },
  })

  if (updateError) {
    return { url: null, error: updateError }
  }

  return { url: avatarUrl, error: null }
}

export async function removeAvatarImage(userId: string, avatarUrl: string | null) {
  const path = getAvatarPathFromUrl(avatarUrl)
  const supabaseClient = supabase()

  if (path) {
    const { error: storageError } = await supabaseClient.storage.from(AVATAR_BUCKET).remove([path])
    if (storageError) {
      return { error: storageError }
    }
  } else {
    const { error: storageError } = await removeAvatarFiles(userId)
    if (storageError) {
      return { error: storageError }
    }
  }

  const { error } = await supabaseClient.auth.updateUser({
    data: { avatar_url: null },
  })

  return { error }
}

export async function getCurrentUser() {
  const supabaseClient = supabase()
  const { data: { user }, error } = await supabaseClient.auth.getUser()

  if (error || !user) {
    return { user: null, error: error ?? { message: 'User not found' } }
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
      fullName: String(user.user_metadata?.full_name ?? ''),
      avatarUrl: user.user_metadata?.avatar_url ? String(user.user_metadata.avatar_url) : null,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
    } satisfies UserProfile,
    error: null,
  }
}

export async function updateProfile({ fullName }: { fullName: string }) {
  const validated = profileUpdateSchema().safeParse({ fullName })
  if (!validated.success) {
    return { user: null, error: validated.error.flatten().fieldErrors }
  }

  const supabaseClient = supabase()
  const { data, error } = await supabaseClient.auth.updateUser({
    data: { full_name: validated.data.fullName },
  })

  if (error) {
    return { user: null, error: error.message }
  }

  return { user: data.user, error: null }
}

export async function updatePassword({
  password,
  confirmPassword,
}: {
  password: string
  confirmPassword: string
}) {
  const validated = passwordUpdateSchema().safeParse({ password, confirmPassword })
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors }
  }

  const supabaseClient = supabase()
  const { error } = await supabaseClient.auth.updateUser({
    password: validated.data.password,
  })

  return { error: error ? error.message : null }
}
