import type { LandingTemplate, LandingTemplateConfig, LandingTemplatePreset, LandingTestimonial, LandingServiceItem, LandingFeatureItem, LandingStatItem } from '@/types/database'
import defaultThumb from '@/assets/default-thumbnail.webp'
import sarabThumb from '@/assets/satab-thumbnail.webp'
import spiceThumb from '@/assets/spice-thumbnail.webp'
import yummyThumb from '@/assets/yummy-thumbnail.webp'
import appleThumb from '@/assets/apple-thumbnail.webp'

const LANDING_SECTION_BG_LIGHT = {
  heroBgColor: '#ffffff',
  heroBgImage: null as string | null,
  aboutBgImage: null as string | null,
  whyBgImage: null as string | null,
  carouselBgImage: null as string | null,
  testimonialsBgImage: null as string | null,
  servicesBgImage: null as string | null,
  galleryBgImage: null as string | null,
  contactBgImage: null as string | null,
  bookBgColor: null as string | null,
  bookBgImage: null as string | null,
}

const LANDING_SECTION_BG_SARAB = {
  ...LANDING_SECTION_BG_LIGHT,
  heroBgColor: '#09090b',
}

const LANDING_SECTION_BG_SPICE = {
  ...LANDING_SECTION_BG_LIGHT,
  heroBgColor: '#0c0a09',
}

const LANDING_ABOUT_WHY_LIGHT_DISABLED = {
  aboutEnabled: false,
  aboutLabel: null as string | null,
  aboutTitle: null as string | null,
  aboutDescription: null as string | null,
  aboutImageUrl: null as string | null,
  aboutBullets: null as string[] | null,
  aboutBgColor: '#ffffff',
  whyEnabled: false,
  whyLabel: null as string | null,
  whyTitle: null as string | null,
  whyDescription: null as string | null,
  whyFeatures: null as LandingFeatureItem[] | null,
  whyStats: null as LandingStatItem[] | null,
  whyBgColor: '#f2f2f2',
}

const LANDING_ABOUT_WHY_DARK_DISABLED = {
  ...LANDING_ABOUT_WHY_LIGHT_DISABLED,
  aboutBgColor: '#18181b',
  whyBgColor: '#18181b',
}

const LANDING_ABOUT_WHY_SPICE_DISABLED = {
  ...LANDING_ABOUT_WHY_LIGHT_DISABLED,
  aboutBgColor: '#0c0a09',
  whyBgColor: '#1c1917',
}

const LANDING_ABOUT_WHY_APPLE = {
  aboutEnabled: true,
  aboutLabel: null as string | null,
  aboutTitle: null as string | null,
  aboutDescription: null as string | null,
  aboutImageUrl: null as string | null,
  aboutBullets: null as string[] | null,
  aboutBgColor: '#ffffff',
  whyEnabled: true,
  whyLabel: null as string | null,
  whyTitle: null as string | null,
  whyDescription: null as string | null,
  whyFeatures: null as LandingFeatureItem[] | null,
  whyStats: null as LandingStatItem[] | null,
  whyBgColor: '#f5f5f7',
}

const LANDING_ABOUT_WHY_YUMMY = {
  aboutEnabled: true,
  aboutLabel: null as string | null,
  aboutTitle: null as string | null,
  aboutDescription: null as string | null,
  aboutImageUrl: null as string | null,
  aboutBullets: null as string[] | null,
  aboutBgColor: '#ffffff',
  whyEnabled: true,
  whyLabel: null as string | null,
  whyTitle: null as string | null,
  whyDescription: null as string | null,
  whyFeatures: null as LandingFeatureItem[] | null,
  whyStats: null as LandingStatItem[] | null,
  whyBgColor: '#f2f2f2',
}

export const LANDING_TEMPLATE_PRESETS: Record<LandingTemplate, LandingTemplatePreset> = {
  default: {
    label: 'Default',
    thumbnail: defaultThumb,
    defaults: {
      heroImageUrl: null, heroTitle: null, heroSubtitle: null, heroTagline: null, primaryColor: '#0f172a',
      carouselEnabled: true, carouselMaxItems: 8, carouselTitle: null, carouselBgColor: '#f1f5f9',
      testimonialsEnabled: false, testimonialsTitle: null, testimonialsData: null, testimonialsBgColor: '#ffffff',
      servicesEnabled: false, servicesTitle: null, servicesSubtitle: null, servicesWhatsapp: null, servicesData: null, servicesBgColor: '#f8fafc',
      galleryEnabled: false, galleryTitle: null, gallerySubtitle: null, galleryImages: null, galleryBgColor: '#ffffff',
      contactEnabled: false, contactTitle: null, contactSubtitle: null, contactAddress: null, contactPhone: null, contactEmail: null,
      contactMapLat: -6.2088, contactMapLng: 106.8456, contactMapZoom: 15, contactBgColor: '#f8fafc',
      ...LANDING_SECTION_BG_LIGHT,
      ...LANDING_ABOUT_WHY_LIGHT_DISABLED,
    },
  },
  sarab: {
    label: 'Sarab',
    thumbnail: sarabThumb,
    defaults: {
      heroImageUrl: null, heroTitle: null, heroSubtitle: null, heroTagline: null, primaryColor: '#ea580c',
      carouselEnabled: true, carouselMaxItems: 8, carouselTitle: null, carouselBgColor: '#09090b',
      testimonialsEnabled: false, testimonialsTitle: null, testimonialsData: null, testimonialsBgColor: '#18181b',
      servicesEnabled: false, servicesTitle: null, servicesSubtitle: null, servicesWhatsapp: null, servicesData: null, servicesBgColor: '#18181b',
      galleryEnabled: false, galleryTitle: null, gallerySubtitle: null, galleryImages: null, galleryBgColor: '#09090b',
      contactEnabled: false, contactTitle: null, contactSubtitle: null, contactAddress: null, contactPhone: null, contactEmail: null,
      contactMapLat: -6.2088, contactMapLng: 106.8456, contactMapZoom: 15, contactBgColor: '#18181b',
      ...LANDING_SECTION_BG_SARAB,
      ...LANDING_ABOUT_WHY_DARK_DISABLED,
    },
  },
  spicehaven: {
    label: 'Spice Haven',
    thumbnail: spiceThumb,
    defaults: {
      heroImageUrl: null, heroTitle: null, heroSubtitle: null, heroTagline: null, primaryColor: '#d97706',
      carouselEnabled: true, carouselMaxItems: 8, carouselTitle: null, carouselBgColor: '#0c0a09',
      testimonialsEnabled: false, testimonialsTitle: null, testimonialsData: null, testimonialsBgColor: '#1c1917',
      servicesEnabled: false, servicesTitle: null, servicesSubtitle: null, servicesWhatsapp: null, servicesData: null, servicesBgColor: '#1c1917',
      galleryEnabled: false, galleryTitle: null, gallerySubtitle: null, galleryImages: null, galleryBgColor: '#0c0a09',
      contactEnabled: false, contactTitle: null, contactSubtitle: null, contactAddress: null, contactPhone: null, contactEmail: null,
      contactMapLat: -6.2088, contactMapLng: 106.8456, contactMapZoom: 15, contactBgColor: '#0c0a09',
      ...LANDING_SECTION_BG_SPICE,
      ...LANDING_ABOUT_WHY_SPICE_DISABLED,
    },
  },
  apple: {
    label: 'Apple',
    thumbnail: appleThumb,
    defaults: {
      heroImageUrl: null, heroTitle: null, heroSubtitle: null, heroTagline: null, primaryColor: '#1d1d1f',
      carouselEnabled: true, carouselMaxItems: 6, carouselTitle: null, carouselBgColor: '#f5f5f7',
      testimonialsEnabled: false, testimonialsTitle: null, testimonialsData: null, testimonialsBgColor: '#ffffff',
      servicesEnabled: false, servicesTitle: null, servicesSubtitle: null, servicesWhatsapp: null, servicesData: null, servicesBgColor: '#000000',
      galleryEnabled: false, galleryTitle: null, gallerySubtitle: null, galleryImages: null, galleryBgColor: '#ffffff',
      contactEnabled: false, contactTitle: null, contactSubtitle: null, contactAddress: null, contactPhone: null, contactEmail: null,
      contactMapLat: -6.2088, contactMapLng: 106.8456, contactMapZoom: 15, contactBgColor: '#f5f5f7',
      ...LANDING_SECTION_BG_LIGHT,
      ...LANDING_ABOUT_WHY_APPLE,
    },
  },
  yummy: {
    label: 'Yummy',
    thumbnail: yummyThumb,
    defaults: {
      heroImageUrl: null, heroTitle: null, heroSubtitle: null, heroTagline: null, primaryColor: '#991b1b',
      carouselEnabled: true, carouselMaxItems: 8, carouselTitle: null, carouselBgColor: '#fef2f2',
      testimonialsEnabled: false, testimonialsTitle: null, testimonialsData: null, testimonialsBgColor: '#ffffff',
      servicesEnabled: false, servicesTitle: null, servicesSubtitle: null, servicesWhatsapp: null, servicesData: null, servicesBgColor: '#fee2e2',
      galleryEnabled: false, galleryTitle: null, gallerySubtitle: null, galleryImages: null, galleryBgColor: '#ffffff',
      contactEnabled: false, contactTitle: null, contactSubtitle: null, contactAddress: null, contactPhone: null, contactEmail: null,
      contactMapLat: -6.2088, contactMapLng: 106.8456, contactMapZoom: 15, contactBgColor: '#fef2f2',
      ...LANDING_SECTION_BG_LIGHT,
      ...LANDING_ABOUT_WHY_YUMMY,
    },
  },
}

export function getLandingConfig(
  template: LandingTemplate,
  overrides: Partial<LandingTemplateConfig> = {},
): LandingTemplateConfig {
  const preset = LANDING_TEMPLATE_PRESETS[template]
  const d = preset.defaults
  return {
    template,
    heroImageUrl: overrides.heroImageUrl ?? d.heroImageUrl,
    heroTitle: overrides.heroTitle ?? d.heroTitle,
    heroSubtitle: overrides.heroSubtitle ?? d.heroSubtitle,
    heroTagline: overrides.heroTagline ?? d.heroTagline,
    navLogoUrl: overrides.navLogoUrl ?? null,
    primaryColor: overrides.primaryColor ?? d.primaryColor,
    carouselEnabled: overrides.carouselEnabled ?? d.carouselEnabled,
    carouselMaxItems: overrides.carouselMaxItems ?? d.carouselMaxItems,
    carouselTitle: overrides.carouselTitle ?? d.carouselTitle,
    carouselBgColor: overrides.carouselBgColor ?? d.carouselBgColor,
    testimonialsEnabled: overrides.testimonialsEnabled ?? d.testimonialsEnabled,
    testimonialsTitle: overrides.testimonialsTitle ?? d.testimonialsTitle,
    testimonialsData: overrides.testimonialsData ?? d.testimonialsData,
    testimonialsBgColor: overrides.testimonialsBgColor ?? d.testimonialsBgColor,
    servicesEnabled: overrides.servicesEnabled ?? d.servicesEnabled,
    servicesTitle: overrides.servicesTitle ?? d.servicesTitle,
    servicesSubtitle: overrides.servicesSubtitle ?? d.servicesSubtitle,
    servicesWhatsapp: overrides.servicesWhatsapp ?? d.servicesWhatsapp,
    servicesData: overrides.servicesData ?? d.servicesData,
    servicesBgColor: overrides.servicesBgColor ?? d.servicesBgColor,
    galleryEnabled: overrides.galleryEnabled ?? d.galleryEnabled,
    galleryTitle: overrides.galleryTitle ?? d.galleryTitle,
    gallerySubtitle: overrides.gallerySubtitle ?? d.gallerySubtitle,
    galleryImages: overrides.galleryImages ?? d.galleryImages,
    galleryBgColor: overrides.galleryBgColor ?? d.galleryBgColor,
    contactEnabled: overrides.contactEnabled ?? d.contactEnabled,
    contactTitle: overrides.contactTitle ?? d.contactTitle,
    contactSubtitle: overrides.contactSubtitle ?? d.contactSubtitle,
    contactAddress: overrides.contactAddress ?? d.contactAddress,
    contactPhone: overrides.contactPhone ?? d.contactPhone,
    contactEmail: overrides.contactEmail ?? d.contactEmail,
    contactMapLat: overrides.contactMapLat ?? d.contactMapLat,
    contactMapLng: overrides.contactMapLng ?? d.contactMapLng,
    contactMapZoom: overrides.contactMapZoom ?? d.contactMapZoom,
    contactBgColor: overrides.contactBgColor ?? d.contactBgColor,
    aboutEnabled: overrides.aboutEnabled ?? d.aboutEnabled,
    aboutLabel: overrides.aboutLabel ?? d.aboutLabel,
    aboutTitle: overrides.aboutTitle ?? d.aboutTitle,
    aboutDescription: overrides.aboutDescription ?? d.aboutDescription,
    aboutImageUrl: overrides.aboutImageUrl ?? d.aboutImageUrl,
    aboutBullets: overrides.aboutBullets ?? d.aboutBullets,
    aboutBgColor: overrides.aboutBgColor ?? d.aboutBgColor,
    whyEnabled: overrides.whyEnabled ?? d.whyEnabled,
    whyLabel: overrides.whyLabel ?? d.whyLabel,
    whyTitle: overrides.whyTitle ?? d.whyTitle,
    whyDescription: overrides.whyDescription ?? d.whyDescription,
    whyFeatures: overrides.whyFeatures ?? d.whyFeatures,
    whyStats: overrides.whyStats ?? d.whyStats,
    whyBgColor: overrides.whyBgColor ?? d.whyBgColor,
    heroBgColor: overrides.heroBgColor ?? d.heroBgColor,
    heroBgImage: overrides.heroBgImage ?? d.heroBgImage,
    aboutBgImage: overrides.aboutBgImage ?? d.aboutBgImage,
    whyBgImage: overrides.whyBgImage ?? d.whyBgImage,
    carouselBgImage: overrides.carouselBgImage ?? d.carouselBgImage,
    testimonialsBgImage: overrides.testimonialsBgImage ?? d.testimonialsBgImage,
    servicesBgImage: overrides.servicesBgImage ?? d.servicesBgImage,
    galleryBgImage: overrides.galleryBgImage ?? d.galleryBgImage,
    contactBgImage: overrides.contactBgImage ?? d.contactBgImage,
    bookBgColor: overrides.bookBgColor ?? d.bookBgColor,
    bookBgImage: overrides.bookBgImage ?? d.bookBgImage,
  }
}

export function extractLandingOverrides(config: {
  landing_hero_image_url?: string | null
  landing_hero_title?: string | null
  landing_hero_subtitle?: string | null
  landing_hero_tagline?: string | null
  landing_primary_color?: string
  landing_carousel_enabled?: boolean
  landing_carousel_max_items?: number
  landing_carousel_title?: string | null
  landing_carousel_bg_color?: string
  landing_testimonials_enabled?: boolean
  landing_testimonials_title?: string | null
  landing_testimonials_data?: LandingTestimonial[] | null
  landing_testimonials_bg_color?: string
  landing_services_enabled?: boolean
  landing_services_title?: string | null
  landing_services_subtitle?: string | null
  landing_services_whatsapp?: string | null
  landing_services_data?: LandingServiceItem[] | null
  landing_services_bg_color?: string
  landing_gallery_enabled?: boolean
  landing_gallery_title?: string | null
  landing_gallery_subtitle?: string | null
  landing_gallery_images?: string[] | null
  landing_gallery_bg_color?: string
  landing_contact_enabled?: boolean
  landing_contact_title?: string | null
  landing_contact_subtitle?: string | null
  landing_contact_address?: string | null
  landing_contact_phone?: string | null
  landing_contact_email?: string | null
  landing_contact_map_lat?: number
  landing_contact_map_lng?: number
  landing_contact_map_zoom?: number
  landing_contact_bg_color?: string
  landing_about_enabled?: boolean
  landing_about_label?: string | null
  landing_about_title?: string | null
  landing_about_description?: string | null
  landing_about_image_url?: string | null
  landing_about_bullets?: string[] | null
  landing_about_bg_color?: string
  landing_why_enabled?: boolean
  landing_why_label?: string | null
  landing_why_title?: string | null
  landing_why_description?: string | null
  landing_why_features?: LandingFeatureItem[] | null
  landing_why_stats?: LandingStatItem[] | null
  landing_why_bg_color?: string
  landing_hero_bg_color?: string
  landing_hero_bg_image?: string | null
  landing_about_bg_image?: string | null
  landing_why_bg_image?: string | null
  landing_carousel_bg_image?: string | null
  landing_testimonials_bg_image?: string | null
  landing_services_bg_image?: string | null
  landing_gallery_bg_image?: string | null
  landing_contact_bg_image?: string | null
  landing_book_bg_color?: string | null
  landing_book_bg_image?: string | null
} | null): Partial<LandingTemplateConfig> {
  if (!config) return {}
  return {
    heroImageUrl: config.landing_hero_image_url ?? null,
    heroTitle: config.landing_hero_title ?? null,
    heroSubtitle: config.landing_hero_subtitle ?? null,
    heroTagline: config.landing_hero_tagline ?? null,
    primaryColor: config.landing_primary_color ?? '',
    carouselEnabled: config.landing_carousel_enabled ?? undefined,
    carouselMaxItems: config.landing_carousel_max_items ?? undefined,
    carouselTitle: config.landing_carousel_title ?? null,
    carouselBgColor: config.landing_carousel_bg_color ?? '',
    testimonialsEnabled: config.landing_testimonials_enabled ?? undefined,
    testimonialsTitle: config.landing_testimonials_title ?? null,
    testimonialsData: config.landing_testimonials_data ?? null,
    testimonialsBgColor: config.landing_testimonials_bg_color ?? '',
    servicesEnabled: config.landing_services_enabled ?? undefined,
    servicesTitle: config.landing_services_title ?? null,
    servicesSubtitle: config.landing_services_subtitle ?? null,
    servicesWhatsapp: config.landing_services_whatsapp ?? null,
    servicesData: config.landing_services_data ?? null,
    servicesBgColor: config.landing_services_bg_color ?? '',
    galleryEnabled: config.landing_gallery_enabled ?? undefined,
    galleryTitle: config.landing_gallery_title ?? null,
    gallerySubtitle: config.landing_gallery_subtitle ?? null,
    galleryImages: config.landing_gallery_images ?? null,
    galleryBgColor: config.landing_gallery_bg_color ?? '',
    contactEnabled: config.landing_contact_enabled ?? undefined,
    contactTitle: config.landing_contact_title ?? null,
    contactSubtitle: config.landing_contact_subtitle ?? null,
    contactAddress: config.landing_contact_address ?? null,
    contactPhone: config.landing_contact_phone ?? null,
    contactEmail: config.landing_contact_email ?? null,
    contactMapLat: config.landing_contact_map_lat ?? undefined,
    contactMapLng: config.landing_contact_map_lng ?? undefined,
    contactMapZoom: config.landing_contact_map_zoom ?? undefined,
    contactBgColor: config.landing_contact_bg_color ?? '',
    aboutEnabled: config.landing_about_enabled ?? undefined,
    aboutLabel: config.landing_about_label ?? null,
    aboutTitle: config.landing_about_title ?? null,
    aboutDescription: config.landing_about_description ?? null,
    aboutImageUrl: config.landing_about_image_url ?? null,
    aboutBullets: config.landing_about_bullets ?? null,
    aboutBgColor: config.landing_about_bg_color ?? '',
    whyEnabled: config.landing_why_enabled ?? undefined,
    whyLabel: config.landing_why_label ?? null,
    whyTitle: config.landing_why_title ?? null,
    whyDescription: config.landing_why_description ?? null,
    whyFeatures: config.landing_why_features ?? null,
    whyStats: config.landing_why_stats ?? null,
    whyBgColor: config.landing_why_bg_color ?? '',
    heroBgColor: config.landing_hero_bg_color ?? '',
    heroBgImage: config.landing_hero_bg_image ?? null,
    aboutBgImage: config.landing_about_bg_image ?? null,
    whyBgImage: config.landing_why_bg_image ?? null,
    carouselBgImage: config.landing_carousel_bg_image ?? null,
    testimonialsBgImage: config.landing_testimonials_bg_image ?? null,
    servicesBgImage: config.landing_services_bg_image ?? null,
    galleryBgImage: config.landing_gallery_bg_image ?? null,
    contactBgImage: config.landing_contact_bg_image ?? null,
    bookBgColor: config.landing_book_bg_color ?? null,
    bookBgImage: config.landing_book_bg_image ?? null,
    navLogoUrl: config.landing_nav_logo_url ?? null,
  }
}
