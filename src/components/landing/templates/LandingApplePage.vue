<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, UtensilsCrossed, Check, ChefHat, Users, Leaf, Star, MapPin, Phone, Mail, Clock, ImageIcon } from '@lucide/vue'
import ApplicationLayout from '@/layouts/ApplicationLayout.vue'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/composables/useI18n'
import { landingSectionStyle } from '@/lib/landing-section-style'
import AppleNav from '@/components/landing/apple/AppleNav.vue'
import type { LandingPageProps } from '@/components/landing/landing-page-props'

const props = defineProps<Omit<LandingPageProps, 'template'>>()

const { t } = useI18n()

const displayTitle = computed(() => props.heroTitle || props.shopName)
const displaySubtitle = computed(() => props.heroSubtitle || t('config.landingAppleHero'))
const displayTagline = computed(() => props.heroTagline || t('config.landingAppleTagline'))

const heroStyle = computed(() => {
  if (props.heroBgImage?.trim()) {
    return landingSectionStyle(props.heroBgImage, props.heroBgColor || '#000000')
  }
  return { backgroundColor: '#000000' }
})

const aboutImage = computed(() => props.aboutImageUrl || props.heroImageUrl)
const aboutStyle = computed(() => landingSectionStyle(props.aboutBgImage, props.aboutBgColor || '#ffffff'))
const whyStyle = computed(() => landingSectionStyle(props.whyBgImage, props.whyBgColor || '#f5f5f7'))
const servicesStyle = computed(() => landingSectionStyle(props.servicesBgImage, props.servicesBgColor || '#000000'))
const galleryStyle = computed(() => landingSectionStyle(props.galleryBgImage, props.galleryBgColor || '#ffffff'))
const contactStyle = computed(() => landingSectionStyle(props.contactBgImage, props.contactBgColor || '#f5f5f7'))

const aboutBulletsList = computed(() => {
  if (props.aboutBullets?.length) return props.aboutBullets
  return [
    t('config.landingAppleAboutBullet1'),
    t('config.landingAppleAboutBullet2'),
    t('config.landingAppleAboutBullet3'),
  ]
})

const whyFeaturesList = computed(() => {
  if (props.whyFeatures?.length) return props.whyFeatures
  return [
    { title: t('config.landingAppleFeat1Title'), description: t('config.landingAppleFeat1Desc') },
    { title: t('config.landingAppleFeat2Title'), description: t('config.landingAppleFeat2Desc') },
    { title: t('config.landingAppleFeat3Title'), description: t('config.landingAppleFeat3Desc') },
  ]
})

const menuCount = computed(() => props.products.length)

const whyStatsList = computed(() => {
  if (props.whyStats?.length) {
    return props.whyStats.map((stat) => ({
      value: stat.value === '{menuCount}' ? `${menuCount.value}+` : stat.value,
      label: stat.label,
    }))
  }
  return [
    { value: '850+', label: t('config.landingAppleStat1') },
    { value: `${menuCount.value}+`, label: t('config.landingAppleStat2') },
    { value: '15+', label: t('config.landingAppleStat3') },
  ]
})

const featureIcons = [ChefHat, Users, Leaf]
</script>

<template>
  <ApplicationLayout>
    <div class="w-full bg-white text-[#1d1d1f]">
      <div class="landing-scroll-progress fixed top-0 right-0 left-0 z-[60] h-0.5 origin-left scale-x-0" :style="{ backgroundColor: primaryColor }" />
      <AppleNav :shop-name="shopName" :accent-color="primaryColor" :nav-logo-url="navLogoUrl" />

      <section id="hero" class="landing-fade-in relative min-h-[90vh] overflow-hidden bg-black" :style="heroStyle">
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black" />
        <div class="landing-hero-choreo relative z-10 mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center justify-center px-6 py-32 text-center">
           <p class="mb-6 text-sm text-white/40">
            {{ displayTagline }}
          </p>
          <h1 class="max-w-4xl text-5xl leading-tight font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
            {{ displayTitle }}
          </h1>
          <p class="mt-6 max-w-xl text-lg leading-relaxed text-white/60">
            {{ displaySubtitle }}
          </p>
          <div class="mt-10 flex flex-wrap justify-center gap-4">
            <RouterLink to="/order">
              <Button size="lg" class="h-12 rounded-full bg-white px-8 text-base font-semibold text-black hover:bg-white/90">
                {{ t('nav.createTransaction') }}
                <ArrowRight class="ml-2 size-5" />
              </Button>
            </RouterLink>
            <RouterLink to="/book">
              <Button size="lg" variant="outline" class="h-12 rounded-full border-white/30 px-8 text-base font-semibold text-white hover:bg-white/10">
                {{ t('nav.bookings') }}
              </Button>
            </RouterLink>
          </div>
        </div>
        <div v-if="heroImageUrl" class="landing-parallax absolute inset-0 z-0">
          <img :src="heroImageUrl" alt="" class="h-full w-full object-cover opacity-50" />
        </div>
      </section>

      <section
        v-if="aboutEnabled"
        id="about"
        class="landing-fade-up px-6 py-24"
        :style="aboutStyle"
      >
        <div class="mx-auto max-w-7xl">
          <div class="grid items-center gap-16 lg:grid-cols-2">
            <div class="overflow-hidden rounded-2xl">
              <img
                v-if="aboutImage"
                :src="aboutImage"
                :alt="shopName"
                class="h-full min-h-[400px] w-full object-cover"
              />
              <div
                v-else
                class="flex min-h-[400px] items-center justify-center rounded-2xl bg-[#f5f5f7]"
              >
                <UtensilsCrossed class="size-20 text-[#d2d2d7]" />
              </div>
            </div>
            <div class="max-w-lg">
              <p class="mb-2 text-sm text-[#86868b]">
                {{ aboutLabel || t('config.landingAppleAbout') }}
              </p>
              <h2 class="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
                {{ aboutTitle || t('config.landingAppleAboutTitle') }}
              </h2>
              <p class="mb-8 text-lg leading-relaxed text-[#86868b]">
                {{ aboutDescription || t('config.landingAppleAboutDesc') }}
              </p>
              <ul class="space-y-4">
                <li
                  v-for="(bullet, idx) in aboutBulletsList"
                  :key="idx"
                  class="flex gap-3 text-[#1d1d1f]"
                >
                  <Check class="mt-1 size-5 shrink-0" :style="{ color: primaryColor }" />
                  <span>{{ bullet }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="whyEnabled"
        id="features"
        class="landing-fade-up px-6 py-24"
        :style="whyStyle"
      >
        <div class="mx-auto max-w-7xl text-center">
          <p class="mb-2 text-sm text-[#86868b]">
            {{ whyLabel || t('config.landingAppleWhy') }}
          </p>
          <h2 class="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
            {{ whyTitle || t('config.landingAppleWhy') }}
          </h2>
          <p v-if="whyDescription" class="mx-auto mb-16 max-w-2xl text-lg text-[#86868b]">
            {{ whyDescription }}
          </p>
          <div class="grid gap-8 sm:grid-cols-3">
            <div
              v-for="(feat, idx) in whyFeaturesList"
              :key="feat.title"
              class="landing-stagger rounded-lg border border-[#d2d2d7] bg-white p-8 text-center"
              :style="{ '--i': idx }"
            >
              <component :is="featureIcons[idx % featureIcons.length]" class="mx-auto mb-5 size-10" :style="{ color: primaryColor }" />
              <h3 class="mb-3 text-xl font-semibold">{{ feat.title }}</h3>
              <p class="text-[#86868b]">{{ feat.description }}</p>
            </div>
          </div>
          <div v-if="whyStatsList.length > 0" class="mt-16 grid gap-8 rounded-2xl border border-[#d2d2d7] bg-white px-8 py-12 sm:grid-cols-3">
            <div v-for="stat in whyStatsList" :key="stat.label" class="text-center">
              <p class="landing-counter text-4xl font-bold" :style="{ color: primaryColor }">{{ stat.value }}</p>
              <p class="mt-2 text-sm text-[#86868b]">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="carouselEnabled && products.length > 0"
        id="menu"
        class="landing-fade-up bg-[#f5f5f7] px-6 py-24"
      >
        <div class="mx-auto max-w-7xl text-center">
          <p class="mb-2 text-sm text-[#86868b]">
            {{ t('config.landingAppleMenuLabel') }}
          </p>
          <h2 class="mb-12 text-4xl font-bold tracking-tight md:text-5xl">
            {{ carouselTitle || t('config.landingAppleMenuTitle') }}
          </h2>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <RouterLink
              v-for="(product, idx) in products.slice(0, carouselMaxItems)"
              :key="product.id"
              to="/order"
              class="landing-stagger group overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md"
              :style="{ '--i': idx }"
            >
              <div class="relative h-56 overflow-hidden bg-[#f5f5f7]">
                <img
                  v-if="product.image_url"
                  :src="product.image_url"
                  :alt="product.name"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div v-else class="flex h-full items-center justify-center">
                  <UtensilsCrossed class="size-14 text-[#d2d2d7]" />
                </div>
              </div>
              <div class="p-6 text-left">
                <h3 class="mb-1 text-lg font-semibold">{{ product.name }}</h3>
                <p v-if="product.description" class="mb-3 line-clamp-2 text-sm text-[#86868b]">
                  {{ product.description }}
                </p>
                <p class="text-base font-bold" :style="{ color: primaryColor }">
                  {{ `$${(product.price / 100).toFixed(2)}` }}
                </p>
              </div>
            </RouterLink>
          </div>
          <div v-if="products.length > carouselMaxItems" class="mt-12">
            <RouterLink to="/order">
              <Button size="lg" class="h-12 rounded-full px-8 font-semibold text-white" :style="{ backgroundColor: primaryColor }">
                {{ t('config.landingCarouselViewMore') }}
                <ArrowRight class="ml-2 size-5" />
              </Button>
            </RouterLink>
          </div>
        </div>
      </section>

      <section
        v-if="testimonialsEnabled && testimonialsData?.length"
        id="testimonials"
        class="landing-fade-up px-6 py-24"
        :style="galleryStyle"
      >
        <div class="mx-auto max-w-4xl text-center">
          <p class="mb-2 text-sm text-[#86868b]">
            {{ t('config.landingAppleTestimonialsLabel') }}
          </p>
          <h2 class="mb-12 text-4xl font-bold tracking-tight md:text-5xl">
            {{ testimonialsTitle || t('config.landingAppleTestimonialsTitle') }}
          </h2>
          <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="item in testimonialsData"
              :key="item.name"
              class="rounded-2xl border border-[#d2d2d7] bg-white p-6 text-left"
            >
              <div class="mb-3 flex gap-1">
                <Star v-for="i in 5" :key="i" class="size-4" :class="i <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-[#d2d2d7]'" />
              </div>
              <p class="mb-4 text-sm leading-relaxed text-[#86868b]">&ldquo;{{ item.text }}&rdquo;</p>
              <p class="text-sm font-semibold">{{ item.name }}</p>
              <p v-if="item.role" class="text-xs text-[#86868b]">{{ item.role }}</p>
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="servicesEnabled && servicesData?.length"
        id="services"
        class="landing-fade-up px-6 py-24"
        :style="servicesStyle"
      >
        <div class="mx-auto max-w-7xl text-center">
           <p class="mb-2 text-sm text-white/40">
            {{ t('config.landingAppleServicesLabel') }}
          </p>
          <h2 class="mb-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            {{ servicesTitle || t('config.landingAppleServicesTitle') }}
          </h2>
          <p v-if="servicesSubtitle" class="mx-auto mb-12 max-w-2xl text-white/60">
            {{ servicesSubtitle }}
          </p>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="(item, idx) in servicesData"
              :key="idx"
              class="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left"
            >
              <div class="relative h-48 overflow-hidden">
                <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  :alt="item.title"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div v-else class="flex h-full items-center justify-center">
                  <UtensilsCrossed class="size-12 text-white/20" />
                </div>
                <div class="absolute right-3 bottom-3 rounded-full bg-white/90 px-4 py-1.5 text-sm font-bold text-black">
                  {{ item.price }}
                </div>
              </div>
              <div class="p-6">
                <h3 class="mb-2 text-lg font-semibold text-white">{{ item.title }}</h3>
                <p class="text-sm text-white/60">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="galleryEnabled && galleryImages?.length"
        id="gallery"
        class="landing-fade-up px-6 py-24"
        :style="galleryStyle"
      >
        <div class="mx-auto max-w-7xl text-center">
          <p class="mb-2 text-sm text-[#86868b]">
            {{ t('config.landingAppleGalleryLabel') }}
          </p>
          <h2 class="mb-12 text-4xl font-bold tracking-tight md:text-5xl">
            {{ galleryTitle || t('config.landingAppleGalleryTitle') }}
          </h2>
          <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div
              v-for="(url, idx) in galleryImages"
              :key="idx"
              class="group relative aspect-square overflow-hidden rounded-2xl bg-[#f5f5f7]"
            >
              <img :src="url" :alt="`Gallery ${idx + 1}`" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="contactEnabled"
        id="contact"
        class="landing-fade-up px-6 py-24"
        :style="contactStyle"
      >
        <div class="mx-auto max-w-7xl">
          <div class="text-center">
            <p class="mb-2 text-sm text-[#86868b]">
              {{ t('config.landingAppleContactLabel') }}
            </p>
            <h2 class="mb-12 text-4xl font-bold tracking-tight md:text-5xl">
              {{ contactTitle || t('config.landingAppleContactTitle') }}
            </h2>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div v-if="contactAddress || shopAddress" class="rounded-2xl border border-[#d2d2d7] bg-white p-6 text-center">
              <MapPin class="mx-auto mb-3 size-6" :style="{ color: primaryColor }" />
              <p class="text-sm text-[#86868b]">{{ contactAddress || shopAddress }}</p>
            </div>
            <div v-if="contactPhone || shopPhone" class="rounded-2xl border border-[#d2d2d7] bg-white p-6 text-center">
              <Phone class="mx-auto mb-3 size-6" :style="{ color: primaryColor }" />
              <p class="text-sm text-[#86868b]">{{ contactPhone || shopPhone }}</p>
            </div>
            <div v-if="contactEmail" class="rounded-2xl border border-[#d2d2d7] bg-white p-6 text-center">
              <Mail class="mx-auto mb-3 size-6" :style="{ color: primaryColor }" />
              <p class="text-sm text-[#86868b]">{{ contactEmail }}</p>
            </div>
            <div class="rounded-2xl border border-[#d2d2d7] bg-white p-6 text-center">
              <Clock class="mx-auto mb-3 size-6" :style="{ color: primaryColor }" />
              <p class="text-sm text-[#86868b]">{{ t('config.landingDefaultHours') }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="landing-fade-up bg-black px-6 py-24 text-center">
        <h2 class="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
          {{ t('config.landingAppleCta') }}
        </h2>
        <p class="mx-auto mb-10 max-w-xl text-lg text-white/60">
          {{ t('config.landingAppleCtaDesc') }}
        </p>
        <RouterLink to="/order">
          <Button size="lg" class="h-12 rounded-full bg-white px-8 text-base font-semibold text-black hover:bg-white/90">
            {{ t('nav.createTransaction') }}
            <ArrowRight class="ml-2 size-5" />
          </Button>
        </RouterLink>
      </section>

      <footer class="border-t border-[#d2d2d7] bg-[#f5f5f7] px-6 py-8">
        <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-[#86868b] sm:flex-row">
          <p>&copy; {{ shopName }}. {{ t('config.landingAppleCopyright') }}</p>
          <div class="flex gap-6">
            <RouterLink to="/order" class="hover:text-[#1d1d1f]">{{ t('nav.createTransaction') }}</RouterLink>
            <RouterLink to="/book" class="hover:text-[#1d1d1f]">{{ t('nav.bookings') }}</RouterLink>
          </div>
        </div>
      </footer>
    </div>
  </ApplicationLayout>
</template>
