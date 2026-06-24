import type { UserRole } from '@/types/database'

export type { UserRole }

const PATH_ACCESS: Record<string, UserRole[]> = {
  '/dashboard': ['owner', 'staff'],
  '/profile': ['owner', 'staff'],
  '/transactions': ['owner', 'staff'],
  '/transactions/list': ['owner', 'staff'],
  '/orders/inbox': ['owner', 'staff'],
  '/queue': ['owner', 'staff'],
  '/stock/restock': ['owner'],
  '/stock/opname': ['owner'],
  '/analytics': ['owner'],
  '/shifts': ['owner', 'staff'],
  '/master/products': ['owner', 'staff'],
  '/master/categories': ['owner', 'staff'],
  '/master/customers': ['owner', 'staff'],
  '/master/users': ['owner'],
  '/config': ['owner'],
}

export function canAccessPath(path: string, role: UserRole | null) {
  if (!role) return true
  const allowed = PATH_ACCESS[path]
  if (!allowed) return true
  return allowed.includes(role)
}

export function canWriteMasterData(role: UserRole | null) {
  return role === 'owner'
}
