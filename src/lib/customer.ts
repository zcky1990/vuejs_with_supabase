import { supabase } from './supabase'
import type { Customer } from '@/types/database'
import { z } from 'zod'

const customerSchema = z.object({
  name: z.string().min(1, { message: 'Nama harus diisi' }),
  email: z.email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().default(true)
})

export const getCustomers = async () => {
  const supabaseClient = await supabase()
  const { data, error } = await supabaseClient.from('customers').select('*')
  return { customers: data, error }
}

export const getCustomerByName = async (name: string) => {
  const supabaseClient = await supabase()
  const { data, error } = await supabaseClient.from('customers').select('*').ilike('name', `%${name}%`)
  return { customers: data, error }
}

export const createCustomer = async (customer: Customer) => {
  const validatedCustomer = customerSchema.safeParse(customer)
  if (!validatedCustomer.success) {
    return { error: validatedCustomer.error.message }
  }
  const supabaseClient = await supabase()
  const { data, error } = await supabaseClient.from('customers').insert(validatedCustomer.data)
  return { customer: data, error: error ? error.message : null }
}