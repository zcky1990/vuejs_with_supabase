<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { LayoutTemplate, Wallet, ReceiptText, LayoutGrid } from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import StoreConfigTab from '@/components/config/StoreConfigTab.vue'
import LandingConfigTab from '@/components/config/LandingConfigTab.vue'
import PaymentsConfigTab from '@/components/config/PaymentsConfigTab.vue'
import InvoiceConfigTab from '@/components/config/InvoiceConfigTab.vue'
import FeaturesConfigTab from '@/components/config/FeaturesConfigTab.vue'
import satabThumb from '@/assets/satab-thumbnail.webp'
import spiceThumb from '@/assets/spice-thumbnail.webp'
import yummyThumb from '@/assets/yummy-thumbnail.webp'
import defaultThumb from '@/assets/default-thumbnail.webp'
import appleThumb from '@/assets/apple-thumbnail.webp'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/composables/useI18n'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useConfigForm } from '@/composables/useConfigForm'
import { LayoutTemplate as LayoutTemplateIcon } from '@lucide/vue'

const { t } = useI18n()
const {
  isOpen: confirmDialogOpen,
  message: confirmDialogMessage,
  confirm: requestConfirm,
  resolve: resolveConfirmDialog,
} = useConfirmDialog()

const {
  isLoading,
  isDirty,
  isSavingReceipt,
  isSavingTransfer,
  isSavingPaymentFlow,
  isSavingMenuCategories,
  isSavingBooking,
  isSavingLoyalty,
  isSavingInvoice,
  isSavingLanding,
  isUploadingQris,
  isRemovingQris,
  isUploadingLogo,
  isRemovingLogo,
  isUploadingLandingHero,
  isRemovingLandingHero,
  isUploadingLandingAbout,
  isRemovingLandingAbout,
  qrisPreview,
  logoPreview,
  landingHeroPreview,
  landingAboutPreview,
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
  landingHeroTagline,
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
  landingNavLogoPreview,
  isUploadingNavLogo,
  isRemovingNavLogo,
  landingAccordion,
  activeCategories,
  invoicePreviewHtml,
  toggleAccordion,
  loadConfig,
  handleQrisUpload,
  handleRemoveQris,
  handleSaveTransfer,
  handleSaveReceipt,
  handleSavePaymentFlow,
  handleSaveBooking,
  handleSaveLoyalty,
  handleSaveInvoice,
  handleSaveLanding,
  handleLandingHeroUpload,
  handleRemoveLandingHero,
  handleLandingAboutUpload,
  handleRemoveLandingAbout,
  handleLogoUpload,
  handleRemoveLogo,
  handleSaveMenuCategories,
  handleMenuCategoryCustomChange,
  addAboutBullet,
  removeAboutBullet,
  addWhyFeature,
  removeWhyFeature,
  addWhyStat,
  removeWhyStat,
  addTestimonial,
  removeTestimonial,
  handleTestimonialAvatarUpload,
  handleTestimonialAvatarRemove,
  addServiceItem,
  removeServiceItem,
  handleServiceImageUpload,
  handleServiceImageRemove,
  addGalleryImage,
  removeGalleryImage,
  handleGalleryImageUpload,
  handleGalleryImageRemove,
  handleNavLogoUpload,
  handleRemoveNavLogo,
} = useConfigForm({ confirm: requestConfirm })

const activeTab = ref('store')

const tabs = computed(() => [
  { id: 'store', label: t('config.tabStore'), icon: LayoutTemplate },
  { id: 'payments', label: t('config.tabPayments'), icon: Wallet },
  { id: 'invoice', label: t('config.tabInvoice'), icon: ReceiptText },
  { id: 'features', label: t('config.tabFeatures'), icon: LayoutGrid },
])

const templateOptions = computed(() => [
  { id: 'default', name: t('config.landingDefault'), desc: t('config.landingDefaultDesc'), thumb: defaultThumb, color: null },
  { id: 'sarab', name: t('config.landingSarab'), desc: t('config.landingSarabDesc'), thumb: satabThumb, color: null },
  { id: 'spicehaven', name: t('config.landingSpiceHaven'), desc: t('config.landingSpiceHavenDesc'), thumb: spiceThumb, color: null },
  { id: 'yummy', name: t('config.landingYummy'), desc: t('config.landingYummyDesc'), thumb: yummyThumb, color: null },
  { id: 'apple', name: t('config.landingApple'), desc: t('config.landingAppleDesc'), thumb: appleThumb, color: null },
])

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!isDirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onBeforeRouteLeave(async () => {
  if (!isDirty.value) return true
  return requestConfirm(t('config.unsavedChangesWarning'))
})

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  loadConfig()
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6 p-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">{{ t('config.title') }}</h1>
        <p class="text-sm text-muted-foreground">{{ t('config.subtitle') }}</p>
      </div>

      <div v-if="isLoading" class="rounded-xl border px-4 py-10 text-center text-muted-foreground">
        {{ t('config.loading') }}
      </div>

      <template v-else>
        <div class="flex flex-wrap gap-1.5 rounded-xl border bg-muted/50 p-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
            :class="activeTab === tab.id
              ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'"
            @click="activeTab = tab.id"
          >
            <component :is="tab.icon" class="size-4" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab: Store -->
        <div v-show="activeTab === 'store'" class="grid gap-6">
          <Card class="lg:col-span-2 border-t-2 border-t-blue-500">
            <CardHeader>
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  <LayoutTemplateIcon class="size-5" />
                </div>
                <div>
                  <CardTitle>{{ t('config.landingTitle') }}</CardTitle>
                  <CardDescription>{{ t('config.landingDesc') }}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LandingConfigTab
                :template-options="templateOptions"
                :landing-template="landingTemplate"
                :landing-hero-image="landingHeroImage"
                :landing-hero-title="landingHeroTitle"
                :landing-hero-subtitle="landingHeroSubtitle"
                :landing-hero-tagline="landingHeroTagline"
                :landing-primary-color="landingPrimaryColor"
                :landing-hero-bg-color="landingHeroBgColor"
                :landing-hero-bg-image="landingHeroBgImage"
                :landing-hero-preview="landingHeroPreview"
                :is-uploading-landing-hero="isUploadingLandingHero"
                :is-removing-landing-hero="isRemovingLandingHero"
                :is-saving-landing="isSavingLanding"
                :landing-carousel-enabled="landingCarouselEnabled"
                :landing-carousel-max-items="landingCarouselMaxItems"
                :landing-carousel-title="landingCarouselTitle"
                :landing-carousel-bg-color="landingCarouselBgColor"
                :landing-carousel-bg-image="landingCarouselBgImage"
                :landing-testimonials-enabled="landingTestimonialsEnabled"
                :landing-testimonials-title="landingTestimonialsTitle"
                :landing-testimonials-data="landingTestimonialsData"
                :landing-testimonials-bg-color="landingTestimonialsBgColor"
                :landing-testimonials-bg-image="landingTestimonialsBgImage"
                :landing-services-enabled="landingServicesEnabled"
                :landing-services-title="landingServicesTitle"
                :landing-services-subtitle="landingServicesSubtitle"
                :landing-services-whatsapp="landingServicesWhatsapp"
                :landing-services-data="landingServicesData"
                :landing-services-bg-color="landingServicesBgColor"
                :landing-services-bg-image="landingServicesBgImage"
                :landing-gallery-enabled="landingGalleryEnabled"
                :landing-gallery-title="landingGalleryTitle"
                :landing-gallery-subtitle="landingGallerySubtitle"
                :landing-gallery-images="landingGalleryImages"
                :landing-gallery-bg-color="landingGalleryBgColor"
                :landing-gallery-bg-image="landingGalleryBgImage"
                :landing-contact-enabled="landingContactEnabled"
                :landing-contact-title="landingContactTitle"
                :landing-contact-subtitle="landingContactSubtitle"
                :landing-contact-address="landingContactAddress"
                :landing-contact-phone="landingContactPhone"
                :landing-contact-email="landingContactEmail"
                :landing-contact-map-lat="landingContactMapLat"
                :landing-contact-map-lng="landingContactMapLng"
                :landing-contact-map-zoom="landingContactMapZoom"
                :landing-contact-bg-color="landingContactBgColor"
                :landing-contact-bg-image="landingContactBgImage"
                :landing-about-enabled="landingAboutEnabled"
                :landing-about-label="landingAboutLabel"
                :landing-about-title="landingAboutTitle"
                :landing-about-description="landingAboutDescription"
                :landing-about-image="landingAboutImage"
                :landing-about-preview="landingAboutPreview"
                :landing-about-bullets="landingAboutBullets"
                :landing-about-bg-color="landingAboutBgColor"
                :landing-about-bg-image="landingAboutBgImage"
                :is-uploading-landing-about="isUploadingLandingAbout"
                :is-removing-landing-about="isRemovingLandingAbout"
                :landing-why-enabled="landingWhyEnabled"
                :landing-why-label="landingWhyLabel"
                :landing-why-title="landingWhyTitle"
                :landing-why-description="landingWhyDescription"
                :landing-why-features="landingWhyFeatures"
                :landing-why-stats="landingWhyStats"
                :landing-why-bg-color="landingWhyBgColor"
                :landing-why-bg-image="landingWhyBgImage"
                :landing-book-bg-color="landingBookBgColor"
                :landing-book-bg-image="landingBookBgImage"
                :landing-nav-logo-url="landingNavLogoUrl"
                :landing-nav-logo-preview="landingNavLogoPreview"
                :is-uploading-nav-logo="isUploadingNavLogo"
                :is-removing-nav-logo="isRemovingNavLogo"
                :landing-accordion="landingAccordion"
                @update:landing-template="landingTemplate = $event"
                @update:landing-hero-title="landingHeroTitle = $event"
                @update:landing-hero-subtitle="landingHeroSubtitle = $event"
                @update:landing-hero-tagline="landingHeroTagline = $event"
                @update:landing-primary-color="landingPrimaryColor = $event"
                @update:landing-hero-bg-color="landingHeroBgColor = $event"
                @update:landing-hero-bg-image="landingHeroBgImage = $event"
                @update:landing-carousel-enabled="landingCarouselEnabled = $event"
                @update:landing-carousel-max-items="landingCarouselMaxItems = $event"
                @update:landing-carousel-title="landingCarouselTitle = $event"
                @update:landing-carousel-bg-color="landingCarouselBgColor = $event"
                @update:landing-carousel-bg-image="landingCarouselBgImage = $event"
                @update:landing-testimonials-enabled="landingTestimonialsEnabled = $event"
                @update:landing-testimonials-title="landingTestimonialsTitle = $event"
                @update:landing-testimonials-bg-color="landingTestimonialsBgColor = $event"
                @update:landing-testimonials-bg-image="landingTestimonialsBgImage = $event"
                @update:landing-services-enabled="landingServicesEnabled = $event"
                @update:landing-services-title="landingServicesTitle = $event"
                @update:landing-services-subtitle="landingServicesSubtitle = $event"
                @update:landing-services-whatsapp="landingServicesWhatsapp = $event"
                @update:landing-services-bg-color="landingServicesBgColor = $event"
                @update:landing-services-bg-image="landingServicesBgImage = $event"
                @update:landing-gallery-enabled="landingGalleryEnabled = $event"
                @update:landing-gallery-title="landingGalleryTitle = $event"
                @update:landing-gallery-subtitle="landingGallerySubtitle = $event"
                @update:landing-gallery-bg-color="landingGalleryBgColor = $event"
                @update:landing-gallery-bg-image="landingGalleryBgImage = $event"
                @update:landing-contact-enabled="landingContactEnabled = $event"
                @update:landing-contact-title="landingContactTitle = $event"
                @update:landing-contact-subtitle="landingContactSubtitle = $event"
                @update:landing-contact-address="landingContactAddress = $event"
                @update:landing-contact-phone="landingContactPhone = $event"
                @update:landing-contact-email="landingContactEmail = $event"
                @update:landing-contact-map-lat="landingContactMapLat = $event"
                @update:landing-contact-map-lng="landingContactMapLng = $event"
                @update:landing-contact-map-zoom="landingContactMapZoom = $event"
                @update:landing-contact-bg-color="landingContactBgColor = $event"
                @update:landing-contact-bg-image="landingContactBgImage = $event"
                @update:landing-about-enabled="landingAboutEnabled = $event"
                @update:landing-about-label="landingAboutLabel = $event"
                @update:landing-about-title="landingAboutTitle = $event"
                @update:landing-about-description="landingAboutDescription = $event"
                @update:landing-about-bg-color="landingAboutBgColor = $event"
                @update:landing-about-bg-image="landingAboutBgImage = $event"
                @update:landing-why-enabled="landingWhyEnabled = $event"
                @update:landing-why-label="landingWhyLabel = $event"
                @update:landing-why-title="landingWhyTitle = $event"
                @update:landing-why-description="landingWhyDescription = $event"
                @update:landing-why-bg-color="landingWhyBgColor = $event"
                @update:landing-why-bg-image="landingWhyBgImage = $event"
                @update:landing-book-bg-color="landingBookBgColor = $event"
                @update:landing-book-bg-image="landingBookBgImage = $event"
                @toggle-accordion="toggleAccordion"
                @upload-nav-logo="handleNavLogoUpload"
                @remove-nav-logo="handleRemoveNavLogo"
                @upload-landing-hero="handleLandingHeroUpload"
                @remove-landing-hero="handleRemoveLandingHero"
                @upload-landing-about="handleLandingAboutUpload"
                @remove-landing-about="handleRemoveLandingAbout"
                @add-about-bullet="addAboutBullet"
                @remove-about-bullet="removeAboutBullet"
                @add-why-feature="addWhyFeature"
                @remove-why-feature="removeWhyFeature"
                @add-why-stat="addWhyStat"
                @remove-why-stat="removeWhyStat"
                @add-testimonial="addTestimonial"
                @remove-testimonial="removeTestimonial"
                @upload-testimonial-avatar="handleTestimonialAvatarUpload"
                @remove-testimonial-avatar="handleTestimonialAvatarRemove"
                @add-service-item="addServiceItem"
                @remove-service-item="removeServiceItem"
                @upload-service-image="handleServiceImageUpload"
                @remove-service-image="handleServiceImageRemove"
                @add-gallery-image="addGalleryImage"
                @remove-gallery-image="removeGalleryImage"
                @upload-gallery-image="handleGalleryImageUpload"
                @save-landing="handleSaveLanding"
              />
            </CardContent>
          </Card>

          <StoreConfigTab
            :app-title="receiptForm.app_title"
            :shop-name="receiptForm.shop_name"
            :shop-address="receiptForm.shop_address"
            :is-saving="isSavingReceipt"
            @update:app-title="receiptForm.app_title = $event"
            @update:shop-name="receiptForm.shop_name = $event"
            @update:shop-address="receiptForm.shop_address = $event"
            @save="handleSaveReceipt"
          />
        </div>

        <!-- Tab: Payments -->
        <div v-show="activeTab === 'payments'">
          <PaymentsConfigTab
            :payment-flow-mode="paymentFlowForm.payment_flow_mode"
            :require-table-for-eat-first="paymentFlowForm.require_table_for_eat_first"
            :is-saving-payment-flow="isSavingPaymentFlow"
            :qris-preview="qrisPreview"
            :is-uploading-qris="isUploadingQris"
            :is-removing-qris="isRemovingQris"
            :transfer-bank-name="transferForm.transfer_bank_name"
            :transfer-account-number="transferForm.transfer_account_number"
            :transfer-account-holder="transferForm.transfer_account_holder"
            :is-saving-transfer="isSavingTransfer"
            @update:payment-flow-mode="paymentFlowForm.payment_flow_mode = $event"
            @update:require-table-for-eat-first="paymentFlowForm.require_table_for_eat_first = $event"
            @save-payment-flow="handleSavePaymentFlow"
            @upload-qris="handleQrisUpload"
            @remove-qris="handleRemoveQris"
            @update:transfer-bank-name="transferForm.transfer_bank_name = $event"
            @update:transfer-account-number="transferForm.transfer_account_number = $event"
            @update:transfer-account-holder="transferForm.transfer_account_holder = $event"
            @save-transfer="handleSaveTransfer"
          />
        </div>

        <!-- Tab: Invoice -->
        <div v-show="activeTab === 'invoice'">
          <InvoiceConfigTab
            :primary-color="invoiceForm.invoice_primary_color"
            :show-logo="invoiceForm.invoice_show_logo"
            :logo-url="invoiceForm.invoice_logo_url"
            :tax-id="invoiceForm.invoice_tax_id"
            :show-tax-id="invoiceForm.invoice_show_tax_id"
            :terms-text="invoiceForm.invoice_terms_text"
            :show-terms="invoiceForm.invoice_show_terms"
            :footer-text="invoiceForm.invoice_footer_text"
            :show-qris="invoiceForm.invoice_show_qris"
            :show-item-prices="invoiceForm.invoice_show_item_prices"
            :show-qty="invoiceForm.invoice_show_qty"
            :logo-preview="logoPreview"
            :is-uploading-logo="isUploadingLogo"
            :is-removing-logo="isRemovingLogo"
            :is-saving="isSavingInvoice"
            :preview-html="invoicePreviewHtml"
            @update:primary-color="invoiceForm.invoice_primary_color = $event"
            @update:show-logo="invoiceForm.invoice_show_logo = $event"
            @update:tax-id="invoiceForm.invoice_tax_id = $event"
            @update:show-tax-id="invoiceForm.invoice_show_tax_id = $event"
            @update:terms-text="invoiceForm.invoice_terms_text = $event"
            @update:show-terms="invoiceForm.invoice_show_terms = $event"
            @update:footer-text="invoiceForm.invoice_footer_text = $event"
            @update:show-qris="invoiceForm.invoice_show_qris = $event"
            @update:show-item-prices="invoiceForm.invoice_show_item_prices = $event"
            @update:show-qty="invoiceForm.invoice_show_qty = $event"
            @upload-logo="handleLogoUpload"
            @remove-logo="handleRemoveLogo"
            @save="handleSaveInvoice"
          />
        </div>

        <!-- Tab: Features -->
        <div v-show="activeTab === 'features'">
          <FeaturesConfigTab
            :booking-enabled="bookingForm.enable_table_booking"
            :booking-duration="bookingForm.booking_duration_minutes"
            :booking-advance-days="bookingForm.booking_advance_days_max"
            :booking-open-time="bookingForm.booking_open_time"
            :booking-close-time="bookingForm.booking_close_time"
            :booking-auto-confirm="bookingForm.booking_auto_confirm"
            :is-saving-booking="isSavingBooking"
            :loyalty-enabled="loyaltyForm.loyalty_enabled"
            :loyalty-points-per-transaction="loyaltyForm.loyalty_points_per_transaction"
            :loyalty-point-redeem-value="loyaltyForm.loyalty_point_redeem_value"
            :loyalty-minimum-transaction-amount="loyaltyForm.loyalty_minimum_transaction_amount"
            :is-saving-loyalty="isSavingLoyalty"
            :menu-category-custom="menuCategoryCustom"
            :menu-category-ids="menuCategoryIds"
            :categories="activeCategories"
            :is-saving-menu-categories="isSavingMenuCategories"
            @update:booking-enabled="bookingForm.enable_table_booking = $event"
            @update:booking-duration="bookingForm.booking_duration_minutes = $event"
            @update:booking-advance-days="bookingForm.booking_advance_days_max = $event"
            @update:booking-open-time="bookingForm.booking_open_time = $event"
            @update:booking-close-time="bookingForm.booking_close_time = $event"
            @update:booking-auto-confirm="bookingForm.booking_auto_confirm = $event"
            @save-booking="handleSaveBooking"
            @update:loyalty-enabled="loyaltyForm.loyalty_enabled = $event"
            @update:loyalty-points-per-transaction="loyaltyForm.loyalty_points_per_transaction = $event"
            @update:loyalty-point-redeem-value="loyaltyForm.loyalty_point_redeem_value = $event"
            @update:loyalty-minimum-transaction-amount="loyaltyForm.loyalty_minimum_transaction_amount = $event"
            @save-loyalty="handleSaveLoyalty"
            @update:menu-category-custom="handleMenuCategoryCustomChange"
            @update:menu-category-ids="menuCategoryIds = $event"
            @save-menu-categories="handleSaveMenuCategories"
          />
        </div>
      </template>
    </div>
    <ConfirmDialog
      :open="confirmDialogOpen"
      :message="confirmDialogMessage"
      @update:open="(open) => { if (!open) resolveConfirmDialog(false) }"
      @confirm="resolveConfirmDialog(true)"
      @cancel="resolveConfirmDialog(false)"
    />
  </DashboardLayout>
</template>

<style scoped>
.pw {
  font-family: 'Courier New', Courier, monospace;
  font-size: 10px;
  line-height: 1.35;
  color: #000;
  background: #fff;
}
.pw .sn { font-size: 13px; font-weight: bold; text-align: center; margin-bottom: 1px; }
.pw .sa { font-size: 8px; text-align: center; margin-bottom: 4px; }
.pw .tid { font-size: 8px; text-align: center; margin-bottom: 2px; }
.pw .div { border: none; border-top: 1px dashed #999; margin: 4px 0; }
.pw .meta { margin-bottom: 1px; }
.pw .tb { width: 100%; border-collapse: collapse; }
.pw .in { padding: 2px 3px 2px 0; vertical-align: top; }
.pw .iq { padding: 2px 3px; text-align: center; white-space: nowrap; vertical-align: top; }
.pw .ip { padding: 2px 0; text-align: right; white-space: nowrap; vertical-align: top; }
.pw .tf { font-weight: bold; font-size: 11px; }
.pw .tf td { padding-top: 4px; }
.pw .thx { text-align: center; font-weight: bold; margin-top: 4px; }
.pw .ftr { font-size: 9px; text-align: center; margin-top: 2px; }
.pw .trm { font-size: 8px; font-style: italic; margin-top: 2px; }
.pw .logo-w { text-align: center; margin-bottom: 4px; }
.pw .logo-i { max-width: 55mm; max-height: 16mm; }
</style>
