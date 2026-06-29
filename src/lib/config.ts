import { shopConfigSchema } from '@/schema/schema'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { supabase } from './supabase'
import type { ShopConfig, ShopConfigInput, PaymentFlowMode } from '@/types/database'

export type { PaymentFlowMode }

export const SHOP_CONFIG_ID = '00000000-0000-0000-0000-000000000001'
const QRIS_STORAGE_BUCKET = 'shop-assets'
const QRIS_STORAGE_PATH = 'qris/qris'

export const getShopConfig = async () => {
  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('shop_config')
    .select('*')
    .eq('id', SHOP_CONFIG_ID)
    .maybeSingle()

  return { config: data as ShopConfig | null, error }
}

export const updateShopConfig = async (input: ShopConfigInput) => {
  const validated = shopConfigSchema().safeParse(input)
  if (!validated.success) {
    return { config: null, error: validated.error.flatten().fieldErrors }
  }

  const payload: ShopConfigInput = {}

  if (input.shop_name !== undefined) {
    payload.shop_name = validated.data.shop_name?.trim() || null
  }
  if (input.shop_address !== undefined) {
    payload.shop_address = validated.data.shop_address?.trim() || null
  }
  if (input.transfer_bank_name !== undefined) {
    payload.transfer_bank_name = validated.data.transfer_bank_name?.trim() || null
  }
  if (input.transfer_account_number !== undefined) {
    payload.transfer_account_number = validated.data.transfer_account_number?.trim() || null
  }
  if (input.transfer_account_holder !== undefined) {
    payload.transfer_account_holder = validated.data.transfer_account_holder?.trim() || null
  }
  if (input.qris_image_url !== undefined) {
    payload.qris_image_url = input.qris_image_url
  }
  if (input.payment_flow_mode !== undefined) {
    payload.payment_flow_mode = validated.data.payment_flow_mode
  }
  if (input.require_table_for_eat_first !== undefined) {
    payload.require_table_for_eat_first = validated.data.require_table_for_eat_first
  }
  if (input.menu_category_ids !== undefined) {
    payload.menu_category_ids = validated.data.menu_category_ids ?? null
  }
  if (input.enable_table_booking !== undefined) {
    payload.enable_table_booking = validated.data.enable_table_booking
  }
  if (input.booking_duration_minutes !== undefined) {
    payload.booking_duration_minutes = validated.data.booking_duration_minutes
  }
  if (input.booking_advance_days_max !== undefined) {
    payload.booking_advance_days_max = validated.data.booking_advance_days_max
  }
  if (input.booking_open_time !== undefined) {
    payload.booking_open_time = validated.data.booking_open_time
  }
  if (input.booking_close_time !== undefined) {
    payload.booking_close_time = validated.data.booking_close_time
  }
  if (input.booking_auto_confirm !== undefined) {
    payload.booking_auto_confirm = validated.data.booking_auto_confirm
  }
  if (input.loyalty_enabled !== undefined) {
    payload.loyalty_enabled = validated.data.loyalty_enabled
  }
  if (input.loyalty_points_per_transaction !== undefined) {
    payload.loyalty_points_per_transaction = validated.data.loyalty_points_per_transaction
  }
  if (input.loyalty_point_redeem_value !== undefined) {
    payload.loyalty_point_redeem_value = validated.data.loyalty_point_redeem_value
  }

  const supabaseClient = supabase()
  const { data, error } = await supabaseClient
    .from('shop_config')
    .update(payload)
    .eq('id', SHOP_CONFIG_ID)
    .select()
    .single()

  if (error?.code === 'PGRST116') {
    const { data: inserted, error: insertError } = await supabaseClient
      .from('shop_config')
      .insert({ id: SHOP_CONFIG_ID, ...payload })
      .select()
      .single()

    return { config: inserted as ShopConfig | null, error: insertError }
  }

  return { config: data as ShopConfig | null, error }
}

export const uploadQrisImage = async (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const allowed = ['png', 'jpg', 'jpeg', 'webp']
  if (!allowed.includes(extension)) {
    return { url: null, error: { message: useLocaleStore().translate('config.imageMustBeImage') } }
  }

  const path = `${QRIS_STORAGE_PATH}.${extension}`
  const supabaseClient = supabase()
  const { error: uploadError } = await supabaseClient.storage
    .from(QRIS_STORAGE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    return { url: null, error: uploadError }
  }

  const { data } = supabaseClient.storage.from(QRIS_STORAGE_BUCKET).getPublicUrl(path)
  const cacheBustedUrl = `${data.publicUrl}?t=${Date.now()}`

  const { config, error } = await updateShopConfig({ qris_image_url: cacheBustedUrl })
  if (error) {
    return { url: null, error: typeof error === 'object' && 'message' in error ? error : { message: useLocaleStore().translate('error.qrisSaveFailed') } }
  }

  return { url: config?.qris_image_url ?? cacheBustedUrl, error: null }
}

export const removeQrisImage = async () => {
  const supabaseClient = supabase()
  const extensions = ['png', 'jpg', 'jpeg', 'webp']

  await Promise.all(
    extensions.map((extension) =>
      supabaseClient.storage.from(QRIS_STORAGE_BUCKET).remove([`${QRIS_STORAGE_PATH}.${extension}`]),
    ),
  )

  return updateShopConfig({ qris_image_url: null })
}

export function hasQrisConfig(config: ShopConfig | null) {
  return !!config?.qris_image_url
}

export function hasTransferConfig(config: ShopConfig | null) {
  return !!config?.transfer_account_number
}

export function hasPaymentConfig(config: ShopConfig | null) {
  return hasQrisConfig(config) || hasTransferConfig(config)
}

export function canPayFirst(config: ShopConfig | null) {
  return (config?.payment_flow_mode ?? 'both') !== 'eat_first_only'
}

export function canEatFirst(config: ShopConfig | null) {
  return (config?.payment_flow_mode ?? 'both') !== 'pay_first_only'
}

export function requiresTableForEatFirst(config: ShopConfig | null) {
  return config?.require_table_for_eat_first !== false
}

export function isTableBookingEnabled(config: ShopConfig | null) {
  return config?.enable_table_booking === true
}

export function getBookingDefaults(config: ShopConfig | null) {
  return {
    durationMinutes: config?.booking_duration_minutes ?? 120,
    advanceDaysMax: config?.booking_advance_days_max ?? 30,
    openTime: config?.booking_open_time ?? '10:00',
    closeTime: config?.booking_close_time ?? '22:00',
    autoConfirm: config?.booking_auto_confirm ?? true,
  }
}

export function isLoyaltyEnabled(config: ShopConfig | null) {
  return config?.loyalty_enabled === true
}

export function getLoyaltyEarnPoints(config: ShopConfig | null) {
  return config?.loyalty_points_per_transaction ?? 0
}

export function getLoyaltyPointRedeemValue(config: ShopConfig | null) {
  return Number(config?.loyalty_point_redeem_value ?? 0)
}
