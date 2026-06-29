import { supabase } from './supabase'
import { customerSchema } from '@/schema/schema'
import type { Customer, CustomerInput } from '@/types/database'
import { WALK_IN_CUSTOMER_NAME } from '@/types/database'
import type { z } from 'zod'

export function isWalkInCustomer(customer: { name: string } | null | undefined) {
  return customer?.name === WALK_IN_CUSTOMER_NAME
}

function normalizeCustomerInput(input: z.infer<ReturnType<typeof customerSchema>>): CustomerInput {
  return {
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    address: input.address ?? null,
    notes: input.notes ?? null,
    is_active: input.is_active,
    is_member: input.is_member,
  }
}

export const getCustomers = async () => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient.from('customers').select('*').order('created_at', { ascending: false })
  return { customers: data as Customer[] | null, error }
}

export const getCustomerByName = async (name: string) => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient.from('customers').select('*').ilike('name', `%${name}%`)
  return { customers: data as Customer[] | null, error }
}

export const getCustomerById = async (id: string) => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  return { customer: data as Customer | null, error }
}

export const createCustomer = async (customer: CustomerInput) => {
  const validatedCustomer = customerSchema().safeParse(customer)
  if (!validatedCustomer.success) {
    return { customer: null, error: validatedCustomer.error.flatten().fieldErrors }
  }

  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('customers')
    .insert(normalizeCustomerInput(validatedCustomer.data))
    .select()
    .single()

  return { customer: data as Customer | null, error }
}

export const updateCustomer = async (id: string, customer: CustomerInput) => {
  const validatedCustomer = customerSchema().safeParse(customer)
  if (!validatedCustomer.success) {
    return { customer: null, error: validatedCustomer.error.flatten().fieldErrors }
  }

  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('customers')
    .update(normalizeCustomerInput(validatedCustomer.data))
    .eq('id', id)
    .select()
    .single()

  return { customer: data as Customer | null, error }
}

export const deleteCustomer = async (id: string) => {
  const supabaseClient = supabase()
  const { error } = await supabaseClient.from('customers').delete().eq('id', id)
  return { error }
}
