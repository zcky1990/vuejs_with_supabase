import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from './useI18n'
import { useAlertStore } from '@/stores/useAlertStore'
import {
  getShopConfig,
  removeInvoiceLogo,
  removeGalleryImage as removeGalleryImageFile,
  removeLandingAboutImage,
  removeLandingHeroImage,
  removeNavLogo,
  removeQrisImage,
  removeServiceImage,
  removeTestimonialAvatar,
  updateShopConfig,
  uploadInvoiceLogo,
  uploadLandingAboutImage,
  uploadLandingHeroImage,
  uploadNavLogo,
  uploadQrisImage,
  uploadGalleryImage,
  uploadServiceImage,
  uploadTestimonialAvatar,
} from '@/lib/config'
import { applyAppTitle } from '../lib/app-title'
import { LANDING_TEMPLATE_PRESETS, getLandingConfig } from '@/lib/landing'
import { saveLandingPageCache, landingConfigToPageState, filterLandingProducts } from '@/lib/landing-cache'
import { getProducts } from '@/lib/product'
import { getActiveCategories } from '@/lib/category'
import { usesCustomMenuCategories } from '@/lib/menu-categories'
import type {
  PaymentFlowMode,
  ProductCategory,
  ShopConfig,
  LandingTemplate,
  LandingTestimonial,
  LandingServiceItem,
  LandingFeatureItem,
  LandingStatItem,
  LandingTemplateConfig,
} from '@/types/database'

type ConfirmFn = (message: string) => Promise<boolean>

export function useConfigForm(options?: { confirm?: ConfirmFn }) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const alertStore = useAlertStore()

  const isLoading = ref(true)
  const isSavingTransfer = ref(false)
  const isSavingReceipt = ref(false)
  const isSavingPaymentFlow = ref(false)
  const isSavingMenuCategories = ref(false)
  const isSavingBooking = ref(false)
  const isSavingLoyalty = ref(false)
  const isSavingInvoice = ref(false)
  const isUploadingQris = ref(false)
  const isRemovingQris = ref(false)
  const isUploadingLogo = ref(false)
  const isRemovingLogo = ref(false)
  const qrisPreview = ref<string | null>(null)
  const logoPreview = ref<string | null>(null)

  const transferForm = ref({
    transfer_bank_name: '',
    transfer_account_number: '',
    transfer_account_holder: '',
  })

  const receiptForm = ref({
    app_title: '',
    shop_name: '',
    shop_address: '',
  })

  const paymentFlowForm = ref({
    payment_flow_mode: 'both' as PaymentFlowMode,
    require_table_for_eat_first: true,
  })

  const menuCategoryCustom = ref(false)
  const menuCategoryIds = ref<string[]>([])

  const bookingForm = ref({
    enable_table_booking: false,
    booking_duration_minutes: 120,
    booking_advance_days_max: 30,
    booking_open_time: '10:00',
    booking_close_time: '22:00',
    booking_auto_confirm: true,
  })

  const loyaltyForm = ref({
    loyalty_enabled: false,
    loyalty_points_per_transaction: 0,
    loyalty_point_redeem_value: 0,
    loyalty_minimum_transaction_amount: 0,
  })

  const invoiceForm = ref({
    invoice_primary_color: '#000000',
    invoice_show_logo: false,
    invoice_logo_url: null as string | null,
    invoice_tax_id: '',
    invoice_show_tax_id: false,
    invoice_terms_text: '',
    invoice_show_terms: false,
    invoice_footer_text: '',
    invoice_show_qris: true,
    invoice_show_item_prices: true,
    invoice_show_qty: true,
  })

  const landingTemplate = ref('default')
  const landingHeroImage = ref<string | null>(null)
  const landingHeroTitle = ref('')
  const landingHeroSubtitle = ref('')
  const landingPrimaryColor = ref('#0f172a')
  const landingHeroBgColor = ref('#ffffff')
  const landingHeroBgImage = ref('')
  const isSavingLanding = ref(false)
  const isUploadingLandingHero = ref(false)
  const isRemovingLandingHero = ref(false)
  const landingHeroPreview = ref<string | null>(null)
  const landingCarouselEnabled = ref(true)
  const landingCarouselMaxItems = ref(8)
  const landingCarouselTitle = ref('')
  const landingCarouselBgColor = ref('#f1f5f9')
  const landingCarouselBgImage = ref('')
  const landingTestimonialsEnabled = ref(false)
  const landingTestimonialsTitle = ref('')
  const landingTestimonialsData = ref<LandingTestimonial[]>([])
  const landingTestimonialsBgColor = ref('#ffffff')
  const landingTestimonialsBgImage = ref('')
  const landingServicesEnabled = ref(false)
  const landingServicesTitle = ref('')
  const landingServicesSubtitle = ref('')
  const landingServicesWhatsapp = ref('')
  const landingServicesData = ref<LandingServiceItem[]>([])
  const landingServicesBgColor = ref('#f8fafc')
  const landingServicesBgImage = ref('')
  const landingGalleryEnabled = ref(false)
  const landingGalleryTitle = ref('')
  const landingGallerySubtitle = ref('')
  const landingGalleryImages = ref<string[]>([])
  const landingGalleryBgColor = ref('#ffffff')
  const landingGalleryBgImage = ref('')
  const landingContactEnabled = ref(false)
  const landingContactTitle = ref('')
  const landingContactSubtitle = ref('')
  const landingContactAddress = ref('')
  const landingContactPhone = ref('')
  const landingContactEmail = ref('')
  const landingContactMapLat = ref(-6.2088)
  const landingContactMapLng = ref(106.8456)
  const landingContactMapZoom = ref(15)
  const landingContactBgColor = ref('#f8fafc')
  const landingContactBgImage = ref('')
  const landingAboutEnabled = ref(false)
  const landingAboutLabel = ref('')
  const landingAboutTitle = ref('')
  const landingAboutDescription = ref('')
  const landingAboutImage = ref<string | null>(null)
  const landingAboutPreview = ref<string | null>(null)
  const landingAboutBullets = ref<string[]>([])
  const landingAboutBgColor = ref('#ffffff')
  const landingAboutBgImage = ref('')
  const isUploadingLandingAbout = ref(false)
  const isRemovingLandingAbout = ref(false)
  const landingWhyEnabled = ref(false)
  const landingWhyLabel = ref('')
  const landingWhyTitle = ref('')
  const landingWhyDescription = ref('')
  const landingWhyFeatures = ref<LandingFeatureItem[]>([])
  const landingWhyStats = ref<LandingStatItem[]>([])
  const landingWhyBgColor = ref('#f2f2f2')
  const landingWhyBgImage = ref('')
  const landingBookBgColor = ref('')
  const landingBookBgImage = ref('')
  const landingNavLogoUrl = ref<string | null>(null)
  const landingNavLogoPreview = ref<string | null>(null)
  const isUploadingNavLogo = ref(false)
  const isRemovingNavLogo = ref(false)
  const isDirty = ref(false)
  const suppressDirtyTracking = ref(true)
  const isRevertingTemplateSwitch = ref(false)

  async function confirmAction(message: string) {
    if (options?.confirm) {
      return options.confirm(message)
    }
    return confirm(message)
  }

  const landingAccordion = ref<Record<string, boolean>>({
    hero: false,
    about: false,
    why: false,
    carousel: false,
    testimonials: false,
    services: false,
    gallery: false,
    contact: false,
    book: false,
  })

  const activeCategories = ref<ProductCategory[]>([])

  const templateOptions = computed(() => {
    const thumbMap: Record<string, string> = {}
    return [
      { id: 'default', name: t('config.landingDefault'), desc: t('config.landingDefaultDesc'), thumb: thumbMap['default'] || '', color: null },
    ]
  })

  function toggleAccordion(key: string) {
    landingAccordion.value[key] = !landingAccordion.value[key]
  }

  function applyConfig(config: ShopConfig | null) {
    qrisPreview.value = config?.qris_image_url ?? null
    transferForm.value = {
      transfer_bank_name: config?.transfer_bank_name ?? '',
      transfer_account_number: config?.transfer_account_number ?? '',
      transfer_account_holder: config?.transfer_account_holder ?? '',
    }
    receiptForm.value = {
      app_title: config?.app_title ?? '',
      shop_name: config?.shop_name ?? '',
      shop_address: config?.shop_address ?? '',
    }
    applyAppTitle(config?.app_title || config?.shop_name || 'Bistro')
    paymentFlowForm.value = {
      payment_flow_mode: config?.payment_flow_mode ?? 'both',
      require_table_for_eat_first: config?.require_table_for_eat_first ?? true,
    }
    menuCategoryCustom.value = usesCustomMenuCategories(config)
    menuCategoryIds.value = config?.menu_category_ids ? [...config.menu_category_ids] : []
    bookingForm.value = {
      enable_table_booking: config?.enable_table_booking ?? false,
      booking_duration_minutes: config?.booking_duration_minutes ?? 120,
      booking_advance_days_max: config?.booking_advance_days_max ?? 30,
      booking_open_time: (config?.booking_open_time ?? '10:00').slice(0, 5),
      booking_close_time: (config?.booking_close_time ?? '22:00').slice(0, 5),
      booking_auto_confirm: config?.booking_auto_confirm ?? true,
    }
    loyaltyForm.value = {
      loyalty_enabled: config?.loyalty_enabled ?? false,
      loyalty_points_per_transaction: config?.loyalty_points_per_transaction ?? 0,
      loyalty_point_redeem_value: Number(config?.loyalty_point_redeem_value ?? 0),
      loyalty_minimum_transaction_amount: Number(config?.loyalty_minimum_transaction_amount ?? 0),
    }
    logoPreview.value = config?.invoice_logo_url ?? null
    invoiceForm.value = {
      invoice_primary_color: config?.invoice_primary_color || '#000000',
      invoice_show_logo: config?.invoice_show_logo ?? false,
      invoice_logo_url: config?.invoice_logo_url ?? null,
      invoice_tax_id: config?.invoice_tax_id ?? '',
      invoice_show_tax_id: config?.invoice_show_tax_id ?? false,
      invoice_terms_text: config?.invoice_terms_text ?? '',
      invoice_show_terms: config?.invoice_show_terms ?? false,
      invoice_footer_text: config?.invoice_footer_text ?? '',
      invoice_show_qris: config?.invoice_show_qris ?? true,
      invoice_show_item_prices: config?.invoice_show_item_prices ?? true,
      invoice_show_qty: config?.invoice_show_qty ?? true,
    }
    landingTemplate.value = config?.landing_template || 'default'
    landingHeroImage.value = config?.landing_hero_image_url ?? null
    landingHeroPreview.value = config?.landing_hero_image_url ?? null
    landingHeroTitle.value = config?.landing_hero_title ?? ''
    landingHeroSubtitle.value = config?.landing_hero_subtitle ?? ''
    landingPrimaryColor.value = config?.landing_primary_color
      || LANDING_TEMPLATE_PRESETS[(config?.landing_template || 'default') as LandingTemplate].defaults.primaryColor
    landingHeroBgColor.value = config?.landing_hero_bg_color
      || LANDING_TEMPLATE_PRESETS[(config?.landing_template || 'default') as LandingTemplate].defaults.heroBgColor
    landingHeroBgImage.value = config?.landing_hero_bg_image ?? ''
    landingCarouselEnabled.value = config?.landing_carousel_enabled ?? true
    landingCarouselMaxItems.value = config?.landing_carousel_max_items ?? 8
    landingCarouselTitle.value = config?.landing_carousel_title ?? ''
    landingCarouselBgColor.value = config?.landing_carousel_bg_color
      || LANDING_TEMPLATE_PRESETS[(config?.landing_template || 'default') as LandingTemplate].defaults.carouselBgColor
    landingCarouselBgImage.value = config?.landing_carousel_bg_image ?? ''
    landingTestimonialsEnabled.value = config?.landing_testimonials_enabled ?? false
    landingTestimonialsTitle.value = config?.landing_testimonials_title ?? ''
    landingTestimonialsData.value = config?.landing_testimonials_data ?? []
    landingTestimonialsBgColor.value = config?.landing_testimonials_bg_color
      || LANDING_TEMPLATE_PRESETS[(config?.landing_template || 'default') as LandingTemplate].defaults.testimonialsBgColor
    landingTestimonialsBgImage.value = config?.landing_testimonials_bg_image ?? ''
    landingServicesEnabled.value = config?.landing_services_enabled ?? false
    landingServicesTitle.value = config?.landing_services_title ?? ''
    landingServicesSubtitle.value = config?.landing_services_subtitle ?? ''
    landingServicesWhatsapp.value = config?.landing_services_whatsapp ?? ''
    landingServicesData.value = config?.landing_services_data ?? []
    landingServicesBgColor.value = config?.landing_services_bg_color
      || LANDING_TEMPLATE_PRESETS[(config?.landing_template || 'default') as LandingTemplate].defaults.servicesBgColor
    landingServicesBgImage.value = config?.landing_services_bg_image ?? ''
    landingGalleryEnabled.value = config?.landing_gallery_enabled ?? false
    landingGalleryTitle.value = config?.landing_gallery_title ?? ''
    landingGallerySubtitle.value = config?.landing_gallery_subtitle ?? ''
    landingGalleryImages.value = config?.landing_gallery_images ?? []
    landingGalleryBgColor.value = config?.landing_gallery_bg_color
      || LANDING_TEMPLATE_PRESETS[(config?.landing_template || 'default') as LandingTemplate].defaults.galleryBgColor
    landingGalleryBgImage.value = config?.landing_gallery_bg_image ?? ''
    landingContactEnabled.value = config?.landing_contact_enabled ?? false
    landingContactTitle.value = config?.landing_contact_title ?? ''
    landingContactSubtitle.value = config?.landing_contact_subtitle ?? ''
    landingContactAddress.value = config?.landing_contact_address ?? ''
    landingContactPhone.value = config?.landing_contact_phone ?? ''
    landingContactEmail.value = config?.landing_contact_email ?? ''
    landingContactMapLat.value = config?.landing_contact_map_lat ?? -6.2088
    landingContactMapLng.value = config?.landing_contact_map_lng ?? 106.8456
    landingContactMapZoom.value = config?.landing_contact_map_zoom ?? 15
    landingContactBgColor.value = config?.landing_contact_bg_color
      || LANDING_TEMPLATE_PRESETS[(config?.landing_template || 'default') as LandingTemplate].defaults.contactBgColor
    landingContactBgImage.value = config?.landing_contact_bg_image ?? ''
    landingAboutEnabled.value = config?.landing_about_enabled ?? false
    landingAboutLabel.value = config?.landing_about_label ?? ''
    landingAboutTitle.value = config?.landing_about_title ?? ''
    landingAboutDescription.value = config?.landing_about_description ?? ''
    landingAboutImage.value = config?.landing_about_image_url ?? null
    landingAboutPreview.value = config?.landing_about_image_url ?? null
    landingAboutBullets.value = config?.landing_about_bullets ?? []
    landingAboutBgColor.value = config?.landing_about_bg_color
      || LANDING_TEMPLATE_PRESETS[(config?.landing_template || 'default') as LandingTemplate].defaults.aboutBgColor
    landingAboutBgImage.value = config?.landing_about_bg_image ?? ''
    landingWhyEnabled.value = config?.landing_why_enabled ?? false
    landingWhyLabel.value = config?.landing_why_label ?? ''
    landingWhyTitle.value = config?.landing_why_title ?? ''
    landingWhyDescription.value = config?.landing_why_description ?? ''
    landingWhyFeatures.value = config?.landing_why_features ?? []
    landingWhyStats.value = config?.landing_why_stats ?? []
    landingWhyBgColor.value = config?.landing_why_bg_color
      || LANDING_TEMPLATE_PRESETS[(config?.landing_template || 'default') as LandingTemplate].defaults.whyBgColor
    landingWhyBgImage.value = config?.landing_why_bg_image ?? ''
    landingBookBgColor.value = config?.landing_book_bg_color ?? ''
    landingBookBgImage.value = config?.landing_book_bg_image ?? ''
    landingNavLogoUrl.value = config?.landing_nav_logo_url ?? null
    landingNavLogoPreview.value = config?.landing_nav_logo_url ?? null
  }

  async function loadConfig() {
    isLoading.value = true
    const [{ config, error }, categoriesResult] = await Promise.all([
      getShopConfig(),
      getActiveCategories(),
    ])
    isLoading.value = false

    if (error) {
      alertStore.showAlert(t('alert.error'), error.message, 'error')
      return
    }

    if (categoriesResult.error) {
      alertStore.showAlert(t('alert.error'), categoriesResult.error.message, 'error')
    }

    activeCategories.value = categoriesResult.categories ?? []
    suppressDirtyTracking.value = true
    applyConfig(config)
    isDirty.value = false
    await nextTick()
    suppressDirtyTracking.value = false
  }

  async function handleQrisUpload(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      alertStore.showAlert(t('alert.error'), t('config.imageMustBeImage'), 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alertStore.showAlert(t('alert.error'), t('config.imageMaxSize'), 'error')
      return
    }

    isUploadingQris.value = true
    const { url, error } = await uploadQrisImage(file)
    isUploadingQris.value = false

    if (error) {
      alertStore.showAlert(t('alert.error'), error.message, 'error')
      return
    }

    qrisPreview.value = url
    alertStore.showAlert(t('alert.success'), t('config.qrisUploaded'), 'success')
  }

  async function handleRemoveQris() {
    if (!(await confirmAction(t('config.deleteQrisConfirm')))) return

    isRemovingQris.value = true
    const { error } = await removeQrisImage()
    isRemovingQris.value = false

    if (error) {
      const message = typeof error === 'object' && 'message' in error
        ? String(error.message)
        : t('config.qrisDeleteFailed')
      alertStore.showAlert(t('alert.error'), message, 'error')
      return
    }

    qrisPreview.value = null
    alertStore.showAlert(t('alert.success'), t('config.qrisDeleted'), 'success')
  }

  async function handleSaveTransfer() {
    isSavingTransfer.value = true
    const { error } = await updateShopConfig(transferForm.value)
    isSavingTransfer.value = false

    if (error) {
      const message = typeof error === 'object' && 'message' in error
        ? String(error.message)
        : t('config.transferSaveFailed')
      alertStore.showAlert(t('alert.error'), message, 'error')
      return
    }

    alertStore.showAlert(t('alert.success'), t('config.transferSaved'), 'success')
    isDirty.value = false
  }

  async function handleSaveReceipt() {
    isSavingReceipt.value = true
    const { error } = await updateShopConfig({
      app_title: receiptForm.value.app_title.trim() || null,
      shop_name: receiptForm.value.shop_name.trim() || null,
      shop_address: receiptForm.value.shop_address.trim() || null,
    })
    isSavingReceipt.value = false

    if (error) {
      const message = typeof error === 'object' && 'message' in error
        ? String(error.message)
        : t('config.receiptSaveFailed')
      alertStore.showAlert(t('alert.error'), message, 'error')
      return
    }

    applyAppTitle(receiptForm.value.app_title.trim() || receiptForm.value.shop_name.trim() || 'Bistro')
    alertStore.showAlert(t('alert.success'), t('config.receiptSaved'), 'success')
    isDirty.value = false
  }

  async function handleSavePaymentFlow() {
    isSavingPaymentFlow.value = true
    const { error } = await updateShopConfig(paymentFlowForm.value)
    isSavingPaymentFlow.value = false

    if (error) {
      const message = typeof error === 'object' && 'message' in error
        ? String(error.message)
        : t('config.paymentFlowSaveFailed')
      alertStore.showAlert(t('alert.error'), message, 'error')
      return
    }

    alertStore.showAlert(t('alert.success'), t('config.paymentFlowSaved'), 'success')
    isDirty.value = false
  }

  async function handleSaveBooking() {
    isSavingBooking.value = true
    const { error } = await updateShopConfig(bookingForm.value)
    isSavingBooking.value = false

    if (error) {
      const message = typeof error === 'object' && 'message' in error
        ? String(error.message)
        : t('config.bookingSaveFailed')
      alertStore.showAlert(t('alert.error'), message, 'error')
      return
    }

    alertStore.showAlert(t('alert.success'), t('config.bookingSaved'), 'success')
    isDirty.value = false
  }

  async function handleSaveLoyalty() {
    isSavingLoyalty.value = true
    const { error } = await updateShopConfig(loyaltyForm.value)
    isSavingLoyalty.value = false

    if (error) {
      const message = typeof error === 'object' && 'message' in error
        ? String(error.message)
        : t('config.loyaltySaveFailed')
      alertStore.showAlert(t('alert.error'), message, 'error')
      return
    }

    alertStore.showAlert(t('alert.success'), t('config.loyaltySaved'), 'success')
    isDirty.value = false
  }

  async function handleSaveInvoice() {
    isSavingInvoice.value = true
    const { error } = await updateShopConfig(invoiceForm.value)
    isSavingInvoice.value = false

    if (error) {
      const message = typeof error === 'object' && 'message' in error
        ? String(error.message)
        : t('config.invoiceSaveFailed')
      alertStore.showAlert(t('alert.error'), message, 'error')
      return
    }

    alertStore.showAlert(t('alert.success'), t('config.invoiceSaved'), 'success')
    isDirty.value = false
  }

  function buildLandingFormOverrides(): Partial<LandingTemplateConfig> {
    return {
      heroImageUrl: landingHeroImage.value || null,
      heroTitle: landingHeroTitle.value.trim() || null,
      heroSubtitle: landingHeroSubtitle.value.trim() || null,
      primaryColor: landingPrimaryColor.value,
      heroBgColor: landingHeroBgColor.value,
      heroBgImage: landingHeroBgImage.value.trim() || null,
      carouselEnabled: landingCarouselEnabled.value,
      carouselMaxItems: landingCarouselMaxItems.value,
      carouselTitle: landingCarouselTitle.value.trim() || null,
      carouselBgColor: landingCarouselBgColor.value,
      carouselBgImage: landingCarouselBgImage.value.trim() || null,
      testimonialsEnabled: landingTestimonialsEnabled.value,
      testimonialsTitle: landingTestimonialsTitle.value.trim() || null,
      testimonialsData: landingTestimonialsData.value.length > 0 ? landingTestimonialsData.value : null,
      testimonialsBgColor: landingTestimonialsBgColor.value,
      testimonialsBgImage: landingTestimonialsBgImage.value.trim() || null,
      servicesEnabled: landingServicesEnabled.value,
      servicesTitle: landingServicesTitle.value.trim() || null,
      servicesSubtitle: landingServicesSubtitle.value.trim() || null,
      servicesWhatsapp: landingServicesWhatsapp.value.trim() || null,
      servicesData: landingServicesData.value.length > 0 ? landingServicesData.value : null,
      servicesBgColor: landingServicesBgColor.value,
      servicesBgImage: landingServicesBgImage.value.trim() || null,
      galleryEnabled: landingGalleryEnabled.value,
      galleryTitle: landingGalleryTitle.value.trim() || null,
      gallerySubtitle: landingGallerySubtitle.value.trim() || null,
      galleryImages: landingGalleryImages.value.length > 0 ? landingGalleryImages.value : null,
      galleryBgColor: landingGalleryBgColor.value,
      galleryBgImage: landingGalleryBgImage.value.trim() || null,
      contactEnabled: landingContactEnabled.value,
      contactTitle: landingContactTitle.value.trim() || null,
      contactSubtitle: landingContactSubtitle.value.trim() || null,
      contactAddress: landingContactAddress.value.trim() || null,
      contactPhone: landingContactPhone.value.trim() || null,
      contactEmail: landingContactEmail.value.trim() || null,
      contactMapLat: landingContactMapLat.value,
      contactMapLng: landingContactMapLng.value,
      contactMapZoom: landingContactMapZoom.value,
      contactBgColor: landingContactBgColor.value,
      contactBgImage: landingContactBgImage.value.trim() || null,
      aboutEnabled: landingAboutEnabled.value,
      aboutLabel: landingAboutLabel.value.trim() || null,
      aboutTitle: landingAboutTitle.value.trim() || null,
      aboutDescription: landingAboutDescription.value.trim() || null,
      aboutImageUrl: landingAboutImage.value || null,
      aboutBullets: landingAboutBullets.value.filter((b) => b.trim()).length > 0
        ? landingAboutBullets.value.filter((b) => b.trim())
        : null,
      aboutBgColor: landingAboutBgColor.value,
      aboutBgImage: landingAboutBgImage.value.trim() || null,
      whyEnabled: landingWhyEnabled.value,
      whyLabel: landingWhyLabel.value.trim() || null,
      whyTitle: landingWhyTitle.value.trim() || null,
      whyDescription: landingWhyDescription.value.trim() || null,
      whyFeatures: landingWhyFeatures.value.filter((f) => f.title.trim()).length > 0
        ? landingWhyFeatures.value
        : null,
      whyStats: landingWhyStats.value.filter((s) => s.label.trim()).length > 0
        ? landingWhyStats.value
        : null,
      whyBgColor: landingWhyBgColor.value,
      whyBgImage: landingWhyBgImage.value.trim() || null,
      bookBgColor: landingBookBgColor.value.trim() || null,
      bookBgImage: landingBookBgImage.value.trim() || null,
      navLogoUrl: landingNavLogoUrl.value || null,
    }
  }

  async function handleSaveLanding() {
    isSavingLanding.value = true
    const { error } = await updateShopConfig({
      landing_template: landingTemplate.value,
      landing_hero_image_url: landingHeroImage.value || null,
      landing_hero_title: landingHeroTitle.value.trim() || null,
      landing_hero_subtitle: landingHeroSubtitle.value.trim() || null,
      landing_primary_color: landingPrimaryColor.value,
      landing_hero_bg_color: landingHeroBgColor.value,
      landing_hero_bg_image: landingHeroBgImage.value.trim() || null,
      landing_carousel_enabled: landingCarouselEnabled.value,
      landing_carousel_max_items: landingCarouselMaxItems.value,
      landing_carousel_title: landingCarouselTitle.value.trim() || null,
      landing_carousel_bg_color: landingCarouselBgColor.value,
      landing_carousel_bg_image: landingCarouselBgImage.value.trim() || null,
      landing_testimonials_enabled: landingTestimonialsEnabled.value,
      landing_testimonials_title: landingTestimonialsTitle.value.trim() || null,
      landing_testimonials_data: landingTestimonialsData.value.length > 0 ? landingTestimonialsData.value : null,
      landing_testimonials_bg_color: landingTestimonialsBgColor.value,
      landing_testimonials_bg_image: landingTestimonialsBgImage.value.trim() || null,
      landing_services_enabled: landingServicesEnabled.value,
      landing_services_title: landingServicesTitle.value.trim() || null,
      landing_services_subtitle: landingServicesSubtitle.value.trim() || null,
      landing_services_whatsapp: landingServicesWhatsapp.value.trim() || null,
      landing_services_data: landingServicesData.value.length > 0 ? landingServicesData.value : null,
      landing_services_bg_color: landingServicesBgColor.value,
      landing_services_bg_image: landingServicesBgImage.value.trim() || null,
      landing_gallery_enabled: landingGalleryEnabled.value,
      landing_gallery_title: landingGalleryTitle.value.trim() || null,
      landing_gallery_subtitle: landingGallerySubtitle.value.trim() || null,
      landing_gallery_images: landingGalleryImages.value.length > 0 ? landingGalleryImages.value : null,
      landing_gallery_bg_color: landingGalleryBgColor.value,
      landing_gallery_bg_image: landingGalleryBgImage.value.trim() || null,
      landing_contact_enabled: landingContactEnabled.value,
      landing_contact_title: landingContactTitle.value.trim() || null,
      landing_contact_subtitle: landingContactSubtitle.value.trim() || null,
      landing_contact_address: landingContactAddress.value.trim() || null,
      landing_contact_phone: landingContactPhone.value.trim() || null,
      landing_contact_email: landingContactEmail.value.trim() || null,
      landing_contact_map_lat: landingContactMapLat.value,
      landing_contact_map_lng: landingContactMapLng.value,
      landing_contact_map_zoom: landingContactMapZoom.value,
      landing_contact_bg_color: landingContactBgColor.value,
      landing_contact_bg_image: landingContactBgImage.value.trim() || null,
      landing_about_enabled: landingAboutEnabled.value,
      landing_about_label: landingAboutLabel.value.trim() || null,
      landing_about_title: landingAboutTitle.value.trim() || null,
      landing_about_description: landingAboutDescription.value.trim() || null,
      landing_about_image_url: landingAboutImage.value || null,
      landing_about_bullets: landingAboutBullets.value.filter((b) => b.trim()).length > 0
        ? landingAboutBullets.value.filter((b) => b.trim())
        : null,
      landing_about_bg_color: landingAboutBgColor.value,
      landing_about_bg_image: landingAboutBgImage.value.trim() || null,
      landing_why_enabled: landingWhyEnabled.value,
      landing_why_label: landingWhyLabel.value.trim() || null,
      landing_why_title: landingWhyTitle.value.trim() || null,
      landing_why_description: landingWhyDescription.value.trim() || null,
      landing_why_features: landingWhyFeatures.value.filter((f) => f.title.trim()).length > 0
        ? landingWhyFeatures.value
        : null,
      landing_why_stats: landingWhyStats.value.filter((s) => s.label.trim()).length > 0
        ? landingWhyStats.value
        : null,
      landing_why_bg_color: landingWhyBgColor.value,
      landing_why_bg_image: landingWhyBgImage.value.trim() || null,
      landing_book_bg_color: landingBookBgColor.value.trim() || null,
      landing_book_bg_image: landingBookBgImage.value.trim() || null,
      landing_nav_logo_url: landingNavLogoUrl.value || null,
    })
    isSavingLanding.value = false

    if (error) {
      const message = typeof error === 'object' && 'message' in error
        ? String(error.message)
        : t('config.landingSaveFailed')
      alertStore.showAlert(t('alert.error'), message, 'error')
      return
    }

    const tpl = landingTemplate.value as LandingTemplate
    const cfg = getLandingConfig(tpl, buildLandingFormOverrides())
    const { products } = await getProducts()
    const filteredProducts = products ? filterLandingProducts(products) : []

    saveLandingPageCache({
      shopName: receiptForm.value.shop_name.trim() || 'Bistro',
      shopAddress: receiptForm.value.shop_address.trim() || '',
      shopPhone: landingContactPhone.value.trim() || '',
      template: tpl,
      landing: landingConfigToPageState(cfg),
      products: filteredProducts,
    })

    alertStore.showAlert(t('alert.success'), t('config.landingSaved'), 'success')
    isDirty.value = false
    await router.push('/')
  }

  async function handleLandingHeroUpload(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''

    if (!file) return

    if (!file.type.startsWith('image/webp')) {
      alertStore.showAlert(t('alert.error'), t('config.imageMustBeWebp'), 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alertStore.showAlert(t('alert.error'), t('config.imageMaxSize'), 'error')
      return
    }

    isUploadingLandingHero.value = true
    const { url, error } = await uploadLandingHeroImage(file)
    isUploadingLandingHero.value = false

    if (error) {
      alertStore.showAlert(t('alert.error'), error.message, 'error')
      return
    }

    landingHeroPreview.value = url
    landingHeroImage.value = url
    alertStore.showAlert(t('alert.success'), t('config.landingHeroUploaded'), 'success')
  }

  async function handleRemoveLandingHero() {
    if (!(await confirmAction(t('config.landingHeroDeleteConfirm')))) return

    isRemovingLandingHero.value = true
    const { error } = await removeLandingHeroImage()
    isRemovingLandingHero.value = false

    if (error) {
      const message = typeof error === 'object' && 'message' in error
        ? String(error.message)
        : t('config.landingHeroDeleteFailed')
      alertStore.showAlert(t('alert.error'), message, 'error')
      return
    }

    landingHeroPreview.value = null
    landingHeroImage.value = null
    alertStore.showAlert(t('alert.success'), t('config.landingHeroDeleted'), 'success')
  }

  async function handleLandingAboutUpload(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''

    if (!file) return

    if (!file.type.startsWith('image/webp')) {
      alertStore.showAlert(t('alert.error'), t('config.imageMustBeWebp'), 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alertStore.showAlert(t('alert.error'), t('config.imageMaxSize'), 'error')
      return
    }

    isUploadingLandingAbout.value = true
    const { url, error } = await uploadLandingAboutImage(file)
    isUploadingLandingAbout.value = false

    if (error) {
      alertStore.showAlert(t('alert.error'), error.message, 'error')
      return
    }

    landingAboutPreview.value = url
    landingAboutImage.value = url
    alertStore.showAlert(t('alert.success'), t('config.landingAboutUploaded'), 'success')
  }

  async function handleRemoveLandingAbout() {
    if (!(await confirmAction(t('config.landingAboutDeleteConfirm')))) return

    isRemovingLandingAbout.value = true
    const { error } = await removeLandingAboutImage()
    isRemovingLandingAbout.value = false

    if (error) {
      const message = typeof error === 'object' && 'message' in error
        ? String(error.message)
        : t('config.landingAboutDeleteFailed')
      alertStore.showAlert(t('alert.error'), message, 'error')
      return
    }

    landingAboutPreview.value = null
    landingAboutImage.value = null
    alertStore.showAlert(t('alert.success'), t('config.landingAboutDeleted'), 'success')
  }

  function addAboutBullet() {
    landingAboutBullets.value.push('')
  }

  function removeAboutBullet(index: number) {
    landingAboutBullets.value.splice(index, 1)
  }

  function addWhyFeature() {
    landingWhyFeatures.value.push({ title: '', description: '' })
  }

  function removeWhyFeature(index: number) {
    landingWhyFeatures.value.splice(index, 1)
  }

  function addWhyStat() {
    landingWhyStats.value.push({ value: '', label: '' })
  }

  function removeWhyStat(index: number) {
    landingWhyStats.value.splice(index, 1)
  }

  function addTestimonial() {
    landingTestimonialsData.value.push({
      name: '',
      role: '',
      text: '',
      rating: 5,
      avatar_url: null,
    })
  }

  function removeTestimonial(index: number) {
    landingTestimonialsData.value.splice(index, 1)
  }

  async function handleTestimonialAvatarUpload(event: Event, index: number) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''

    if (!file) return

    if (!file.type.startsWith('image/webp')) {
      alertStore.showAlert(t('alert.error'), t('config.imageMustBeWebp'), 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alertStore.showAlert(t('alert.error'), t('config.imageMaxSize'), 'error')
      return
    }

    const { url, error } = await uploadTestimonialAvatar(file, index)
    if (error) {
      alertStore.showAlert(t('alert.error'), error.message, 'error')
      return
    }

    if (!landingTestimonialsData.value[index]) return
    landingTestimonialsData.value[index].avatar_url = url
    alertStore.showAlert(t('alert.success'), t('config.landingTestimonialAvatarUploaded'), 'success')
  }

  async function handleTestimonialAvatarRemove(index: number) {
    await removeTestimonialAvatar(index)
    if (!landingTestimonialsData.value[index]) return
    landingTestimonialsData.value[index].avatar_url = null
    alertStore.showAlert(t('alert.success'), t('config.landingTestimonialAvatarDeleted'), 'success')
  }

  function addServiceItem() {
    landingServicesData.value.push({
      title: '',
      price: '',
      description: '',
      image_url: null,
    })
  }

  function removeServiceItem(index: number) {
    landingServicesData.value.splice(index, 1)
  }

  async function handleServiceImageUpload(event: Event, index: number) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''

    if (!file) return

    if (!file.type.startsWith('image/webp')) {
      alertStore.showAlert(t('alert.error'), t('config.imageMustBeWebp'), 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alertStore.showAlert(t('alert.error'), t('config.imageMaxSize'), 'error')
      return
    }

    const { url, error } = await uploadServiceImage(file, index)
    if (error) {
      alertStore.showAlert(t('alert.error'), error.message, 'error')
      return
    }

    if (!landingServicesData.value[index]) return
    landingServicesData.value[index].image_url = url
    alertStore.showAlert(t('alert.success'), t('config.landingServiceImageUploaded'), 'success')
  }

  async function handleServiceImageRemove(index: number) {
    await removeServiceImage(index)
    if (!landingServicesData.value[index]) return
    landingServicesData.value[index].image_url = null
    alertStore.showAlert(t('alert.success'), t('config.landingServiceImageDeleted'), 'success')
  }

  function addGalleryImage() {
    landingGalleryImages.value.push('')
  }

  function removeGalleryImage(index: number) {
    landingGalleryImages.value.splice(index, 1)
  }

  async function handleGalleryImageUpload(event: Event, index: number) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''

    if (!file) return

    if (!file.type.startsWith('image/webp')) {
      alertStore.showAlert(t('alert.error'), t('config.imageMustBeWebp'), 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alertStore.showAlert(t('alert.error'), t('config.imageMaxSize'), 'error')
      return
    }

    const { url, error } = await uploadGalleryImage(file, index)
    if (error) {
      alertStore.showAlert(t('alert.error'), error.message, 'error')
      return
    }

    landingGalleryImages.value.splice(index, 1, url)
    alertStore.showAlert(t('alert.success'), t('config.landingGalleryImageUploaded'), 'success')
  }

  async function handleGalleryImageRemove(index: number) {
    await removeGalleryImageFile(index)
    landingGalleryImages.value.splice(index, 1, '')
    alertStore.showAlert(t('alert.success'), t('config.landingGalleryImageDeleted'), 'success')
  }

  async function handleNavLogoUpload(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      alertStore.showAlert(t('alert.error'), t('config.imageMustBeImage'), 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alertStore.showAlert(t('alert.error'), t('config.imageMaxSize'), 'error')
      return
    }

    isUploadingNavLogo.value = true
    const { url, error } = await uploadNavLogo(file)
    isUploadingNavLogo.value = false

    if (error) {
      alertStore.showAlert(t('alert.error'), error.message, 'error')
      return
    }

    landingNavLogoPreview.value = url
    landingNavLogoUrl.value = url
    alertStore.showAlert(t('alert.success'), t('config.navLogoUploaded'), 'success')
  }

  async function handleRemoveNavLogo() {
    if (!(await confirmAction(t('config.navLogoDeleteConfirm')))) return

    isRemovingNavLogo.value = true
    const { error } = await removeNavLogo()
    isRemovingNavLogo.value = false

    if (error) {
      const message = typeof error === 'object' && 'message' in error
        ? String(error.message)
        : t('config.navLogoDeleteFailed')
      alertStore.showAlert(t('alert.error'), message, 'error')
      return
    }

    landingNavLogoPreview.value = null
    landingNavLogoUrl.value = null
    alertStore.showAlert(t('alert.success'), t('config.navLogoDeleted'), 'success')
  }

  async function handleLogoUpload(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      alertStore.showAlert(t('alert.error'), t('config.imageMustBeImage'), 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alertStore.showAlert(t('alert.error'), t('config.imageMaxSize'), 'error')
      return
    }

    isUploadingLogo.value = true
    const { url, error } = await uploadInvoiceLogo(file)
    isUploadingLogo.value = false

    if (error) {
      alertStore.showAlert(t('alert.error'), error.message, 'error')
      return
    }

    logoPreview.value = url
    invoiceForm.value.invoice_logo_url = url
    invoiceForm.value.invoice_show_logo = true
    alertStore.showAlert(t('alert.success'), t('config.invoiceLogoUploaded'), 'success')
  }

  async function handleRemoveLogo() {
    if (!(await confirmAction(t('config.invoiceLogoDeleteConfirm')))) return

    isRemovingLogo.value = true
    const { error } = await removeInvoiceLogo()
    isRemovingLogo.value = false

    if (error) {
      const message = typeof error === 'object' && 'message' in error
        ? String(error.message)
        : t('config.invoiceLogoDeleteFailed')
      alertStore.showAlert(t('alert.error'), message, 'error')
      return
    }

    logoPreview.value = null
    invoiceForm.value.invoice_logo_url = null
    invoiceForm.value.invoice_show_logo = false
    alertStore.showAlert(t('alert.success'), t('config.invoiceLogoDeleted'), 'success')
  }

  async function handleSaveMenuCategories() {
    if (menuCategoryCustom.value && menuCategoryIds.value.length === 0) {
      alertStore.showAlert(t('alert.warning'), t('config.menuCategorySelectMin'), 'error')
      return
    }

    isSavingMenuCategories.value = true
    const { error } = await updateShopConfig({
      menu_category_ids: menuCategoryCustom.value ? menuCategoryIds.value : null,
    })
    isSavingMenuCategories.value = false

    if (error) {
      const message = typeof error === 'object' && 'message' in error
        ? String(error.message)
        : t('config.menuCategorySaveFailed')
      alertStore.showAlert(t('alert.error'), message, 'error')
      return
    }

    alertStore.showAlert(t('alert.success'), t('config.menuCategorySaved'), 'success')
    isDirty.value = false
  }

  function handleMenuCategoryCustomChange(enabled: boolean | 'indeterminate') {
    const isEnabled = enabled === true
    menuCategoryCustom.value = isEnabled
    if (!isEnabled) {
      menuCategoryIds.value = []
      return
    }

    if (menuCategoryIds.value.length === 0) {
      menuCategoryIds.value = activeCategories.value.map((category) => category.id)
    }
  }

  const invoicePreviewHtml = computed(() => {
    const c = invoiceForm.value
    const accent = c.invoice_primary_color || '#000000'
    const loc = locale.value
    const fmtPrice = (p: number) => new Intl.NumberFormat(loc === 'en' ? 'en-US' : 'id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p).replace(/\s/g, ' ')

    const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    const shopName = receiptForm.value.shop_name || 'INVOICE'
    const shopAddr = receiptForm.value.shop_address || '42 Flavor Street, NY'

    const items = [
      { label: 'Classic Smash Burger', qty: 2, subtotal: 37998 },
      { label: 'Nashville Hot Chicken', qty: 1, subtotal: 16999 },
      { label: 'Truffle Mushroom Pasta (+ extra cheese)', qty: 1, subtotal: 24999 },
      { label: 'Nutella Lava Cake', qty: 2, subtotal: 23998 },
    ]
    const total = items.reduce((s, i) => s + i.subtotal, 0)

    const itemRows = items.map((item) => {
      const qtyCol = c.invoice_show_qty ? `<td class="iq">${item.qty}x</td>` : ''
      const priceCol = c.invoice_show_item_prices ? `<td class="ip">${fmtPrice(item.subtotal)}</td>` : ''
      if (!c.invoice_show_qty && !c.invoice_show_item_prices) return `<tr><td class="in" colspan="2">${esc(item.label)}</td></tr>`
      return `<tr><td class="in">${esc(item.label)}</td>${qtyCol}${priceCol}</tr>`
    }).join('')

    const logo = c.invoice_show_logo && logoPreview.value ? `<div class="logo-w"><img src="${esc(logoPreview.value)}" class="logo-i"></div>` : ''
    const taxId = c.invoice_show_tax_id && c.invoice_tax_id ? `<p class="tid">NPWP: ${esc(c.invoice_tax_id)}</p>` : ''
    const terms = c.invoice_show_terms && c.invoice_terms_text ? `<hr class="div"><p class="trm">${esc(c.invoice_terms_text)}</p>` : ''
    const qris = c.invoice_show_qris ? '<p>QRIS tersedia</p>' : ''
    const footer = c.invoice_footer_text ? `<hr class="div"><p class="ftr">${esc(c.invoice_footer_text)}</p>` : ''
    const xtra = (c.invoice_show_qty ? 1 : 0) + (c.invoice_show_item_prices ? 1 : 0)

    return `<div class="pw">
      ${logo}
      <p class="sn" style="color:${accent}">${esc(shopName)}</p>
      ${shopAddr ? `<p class="sa">${esc(shopAddr)}</p>` : ''}
      ${taxId}
      <hr class="div">
      <p class="meta">No: INV-20260706-abc123</p>
      <p class="meta">Tgl: 06/07/2026, 14:30</p>
      <p class="meta">Pelanggan: Walk-in Customer</p>
      <hr class="div">
      <table class="tb">${itemRows}</table>
      <tfoot class="tf"><tr class="tr"><td${xtra ? ` colspan="${1 + xtra}"` : ''}>TOTAL</td>    ${c.invoice_show_item_prices ? `<td class="ip">${fmtPrice(total)}</td>` : ''}</tr></tfoot>
      <hr class="div">
      <p>Bayar: Cash</p>
      ${qris}
      ${terms}
      ${footer}
      <p class="thx" style="color:${accent}">Terima kasih</p>
    </div>`
  })

  const markDirty = () => {
    if (suppressDirtyTracking.value) return
    isDirty.value = true
  }

  const dirtySources = [
    transferForm,
    receiptForm,
    paymentFlowForm,
    menuCategoryCustom,
    menuCategoryIds,
    bookingForm,
    loyaltyForm,
    invoiceForm,
    landingTemplate,
    landingHeroImage,
    landingHeroTitle,
    landingHeroSubtitle,
    landingPrimaryColor,
    landingHeroBgColor,
    landingHeroBgImage,
    landingCarouselEnabled,
    landingCarouselMaxItems,
    landingCarouselTitle,
    landingCarouselBgColor,
    landingCarouselBgImage,
    landingTestimonialsEnabled,
    landingTestimonialsTitle,
    landingTestimonialsData,
    landingTestimonialsBgColor,
    landingTestimonialsBgImage,
    landingServicesEnabled,
    landingServicesTitle,
    landingServicesSubtitle,
    landingServicesWhatsapp,
    landingServicesData,
    landingServicesBgColor,
    landingServicesBgImage,
    landingGalleryEnabled,
    landingGalleryTitle,
    landingGallerySubtitle,
    landingGalleryImages,
    landingGalleryBgColor,
    landingGalleryBgImage,
    landingContactEnabled,
    landingContactTitle,
    landingContactSubtitle,
    landingContactAddress,
    landingContactPhone,
    landingContactEmail,
    landingContactMapLat,
    landingContactMapLng,
    landingContactMapZoom,
    landingContactBgColor,
    landingContactBgImage,
    landingAboutEnabled,
    landingAboutLabel,
    landingAboutTitle,
    landingAboutDescription,
    landingAboutImage,
    landingAboutBullets,
    landingAboutBgColor,
    landingAboutBgImage,
    landingWhyEnabled,
    landingWhyLabel,
    landingWhyTitle,
    landingWhyDescription,
    landingWhyFeatures,
    landingWhyStats,
    landingWhyBgColor,
    landingWhyBgImage,
    landingBookBgColor,
    landingBookBgImage,
    landingNavLogoUrl,
  ]

  dirtySources.forEach((source) => {
    watch(source, markDirty, { deep: true })
  })

  watch(landingTemplate, async (newTemplate, oldTemplate) => {
    if (suppressDirtyTracking.value || isRevertingTemplateSwitch.value) return
    if (newTemplate === oldTemplate) return
    const confirmed = await confirmAction(t('config.templateSwitchConfirm'))
    if (!confirmed) {
      isRevertingTemplateSwitch.value = true
      landingTemplate.value = oldTemplate
      isRevertingTemplateSwitch.value = false
      return
    }
    const preset = LANDING_TEMPLATE_PRESETS[newTemplate as LandingTemplate]
    if (!preset) return
    landingPrimaryColor.value = preset.defaults.primaryColor
    landingHeroBgColor.value = preset.defaults.heroBgColor
    landingCarouselBgColor.value = preset.defaults.carouselBgColor
    landingTestimonialsBgColor.value = preset.defaults.testimonialsBgColor
    landingServicesBgColor.value = preset.defaults.servicesBgColor
    landingGalleryBgColor.value = preset.defaults.galleryBgColor
    landingContactBgColor.value = preset.defaults.contactBgColor
    landingAboutEnabled.value = preset.defaults.aboutEnabled
    landingAboutBgColor.value = preset.defaults.aboutBgColor
    landingWhyEnabled.value = preset.defaults.whyEnabled
    landingWhyBgColor.value = preset.defaults.whyBgColor
  })

  return {
    isLoading,
    isDirty,
    activeTab: ref('store'),
    isSavingTransfer, isSavingReceipt, isSavingPaymentFlow, isSavingMenuCategories,
    isSavingBooking, isSavingLoyalty, isSavingInvoice, isSavingLanding,
    isUploadingQris, isRemovingQris, isUploadingLogo, isRemovingLogo,
    isUploadingLandingHero, isRemovingLandingHero,
    isUploadingLandingAbout, isRemovingLandingAbout,
    qrisPreview, logoPreview, landingHeroPreview, landingAboutPreview,
    transferForm, receiptForm, paymentFlowForm,
    menuCategoryCustom, menuCategoryIds, bookingForm, loyaltyForm, invoiceForm,
    landingTemplate, landingHeroImage, landingHeroTitle, landingHeroSubtitle,
    landingPrimaryColor, landingHeroBgColor, landingHeroBgImage,
    landingCarouselEnabled, landingCarouselMaxItems, landingCarouselTitle,
    landingCarouselBgColor, landingCarouselBgImage,
    landingTestimonialsEnabled, landingTestimonialsTitle,
    landingTestimonialsData, landingTestimonialsBgColor, landingTestimonialsBgImage,
    landingServicesEnabled, landingServicesTitle, landingServicesSubtitle,
    landingServicesWhatsapp, landingServicesData,
    landingServicesBgColor, landingServicesBgImage,
    landingGalleryEnabled, landingGalleryTitle, landingGallerySubtitle,
    landingGalleryImages, landingGalleryBgColor, landingGalleryBgImage,
    landingContactEnabled, landingContactTitle, landingContactSubtitle,
    landingContactAddress, landingContactPhone, landingContactEmail,
    landingContactMapLat, landingContactMapLng, landingContactMapZoom,
    landingContactBgColor, landingContactBgImage,
    landingAboutEnabled, landingAboutLabel, landingAboutTitle,
    landingAboutDescription, landingAboutImage, landingAboutBullets,
    landingAboutBgColor, landingAboutBgImage,
    landingWhyEnabled, landingWhyLabel, landingWhyTitle,
    landingWhyDescription, landingWhyFeatures, landingWhyStats,
    landingWhyBgColor, landingWhyBgImage,
    landingBookBgColor, landingBookBgImage,
    landingNavLogoUrl, landingNavLogoPreview, isUploadingNavLogo, isRemovingNavLogo,
    landingAccordion, activeCategories, templateOptions,
    invoicePreviewHtml,
    toggleAccordion,
    loadConfig,
    handleQrisUpload, handleRemoveQris,
    handleSaveTransfer, handleSaveReceipt, handleSavePaymentFlow,
    handleSaveBooking, handleSaveLoyalty, handleSaveInvoice,
    handleSaveLanding,
    handleLandingHeroUpload, handleRemoveLandingHero,
    handleLandingAboutUpload, handleRemoveLandingAbout,
    handleLogoUpload, handleRemoveLogo,
    handleSaveMenuCategories, handleMenuCategoryCustomChange,
    addAboutBullet, removeAboutBullet,
    addWhyFeature, removeWhyFeature,
    addWhyStat, removeWhyStat,
    addTestimonial, removeTestimonial,
    handleTestimonialAvatarUpload, handleTestimonialAvatarRemove,
    addServiceItem, removeServiceItem,
    handleServiceImageUpload, handleServiceImageRemove,
    addGalleryImage, removeGalleryImage,
    handleGalleryImageUpload, handleGalleryImageRemove,
    handleNavLogoUpload, handleRemoveNavLogo,
  }
}
