<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, UtensilsCrossed, Check, ChefHat, Users, Leaf, Star, MapPin, Phone, Mail, Clock, Sparkles } from '@lucide/vue'
import ApplicationLayout from '@/layouts/ApplicationLayout.vue'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/composables/useI18n'
import { landingSectionStyle } from '@/lib/landing-section-style'
import FugaNav from '@/components/landing/fuga/FugaNav.vue'
import type { LandingPageProps } from '@/components/landing/landing-page-props'

const props = defineProps<Omit<LandingPageProps, 'template'>>()

const { t } = useI18n()

const displayTitle = computed(() => props.heroTitle || props.shopName)
const displaySubtitle = computed(() => props.heroSubtitle || t('config.landingFugaHero'))
const displayTagline = computed(() => props.heroTagline || t('config.landingFugaTagline'))

const heroStyle = computed(() => {
  if (props.heroBgImage?.trim()) {
    return landingSectionStyle(props.heroBgImage, props.heroBgColor || '#0f172a')
  }
  return { backgroundColor: '#0f172a' }
})

const aboutImage = computed(() => props.aboutImageUrl || props.heroImageUrl)
const aboutStyle = computed(() => landingSectionStyle(props.aboutBgImage, props.aboutBgColor || '#0f172a'))
const whyStyle = computed(() => landingSectionStyle(props.whyBgImage, props.whyBgColor || '#1e293b'))
const servicesStyle = computed(() => landingSectionStyle(props.servicesBgImage, props.servicesBgColor || '#0f172a'))
const galleryStyle = computed(() => landingSectionStyle(props.galleryBgImage, props.galleryBgColor || '#1e293b'))
const contactStyle = computed(() => landingSectionStyle(props.contactBgImage, props.contactBgColor || '#0f172a'))

const aboutBulletsList = computed(() => {
  if (props.aboutBullets?.length) return props.aboutBullets
  return [
    t('config.landingFugaAboutBullet1'),
    t('config.landingFugaAboutBullet2'),
    t('config.landingFugaAboutBullet3'),
  ]
})

const whyFeaturesList = computed(() => {
  if (props.whyFeatures?.length) return props.whyFeatures
  return [
    { title: t('config.landingFugaFeat1Title'), description: t('config.landingFugaFeat1Desc') },
    { title: t('config.landingFugaFeat2Title'), description: t('config.landingFugaFeat2Desc') },
    { title: t('config.landingFugaFeat3Title'), description: t('config.landingFugaFeat3Desc') },
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
    { value: '10+', label: t('config.landingFugaStat1') },
    { value: `${menuCount.value}+`, label: t('config.landingFugaStat2') },
    { value: '50+', label: t('config.landingFugaStat3') },
    { value: '12', label: t('config.landingFugaStat4') },
  ]
})

const featureIcons = [ChefHat, Users, Leaf]
</script>

<template>
  <ApplicationLayout>
    <div class="w-full bg-[#0f172a] font-serif text-[#f8fafc]">
      <div class="landing-scroll-progress fixed top-0 right-0 left-0 z-[60] h-0.5 origin-left scale-x-0" :style="{ backgroundColor: primaryColor }" />
      <FugaNav :shop-name="shopName" :accent-color="primaryColor" :nav-logo-url="navLogoUrl" />

      <!-- Hero -->
      <section id="hero" class="landing-fade-in relative flex min-h-screen overflow-hidden" :style="heroStyle">
        <div class="landing-parallax absolute inset-0 bg-gradient-to-br from-[#0f172a]/90 via-[#1e293b]/60 to-[#0f172a]" />
        <div class="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 py-32 text-center">
          <p class="landing-hero-choreo mb-6 text-sm text-white/40">
            {{ displayTagline }}
          </p>
          <h1 class="landing-hero-choreo landing-text-reveal max-w-4xl font-serif text-5xl leading-tight font-bold tracking-tight md:text-6xl lg:text-7xl">
            {{ displayTitle }}
          </h1>
          <p class="landing-hero-choreo mt-6 max-w-xl font-sans text-lg leading-relaxed text-white/60">
            {{ displaySubtitle }}
          </p>
          <div class="landing-hero-choreo mt-10 flex flex-wrap justify-center gap-4">
            <RouterLink to="/order">
              <Button size="lg" class="h-12 rounded-full px-8 font-sans text-base font-semibold text-white" :style="{ backgroundColor: primaryColor }">
                {{ t('nav.createTransaction') }}
                <ArrowRight class="ml-2 size-5" />
              </Button>
            </RouterLink>
            <RouterLink to="/book">
              <Button size="lg" variant="outline" class="h-12 rounded-full border-white/30 px-8 font-sans text-base font-semibold text-white hover:bg-white/10">
                {{ t('nav.bookings') }}
              </Button>
            </RouterLink>
          </div>
        </div>
        <div v-if="heroImageUrl" class="landing-parallax absolute inset-0 z-0" data-parallax-distance="80">
          <img :src="heroImageUrl" alt="" class="h-full w-full object-cover opacity-30" />
        </div>
      </section>

      <!-- About -->
      <section
        v-if="aboutEnabled"
        id="about"
        class="landing-fade-up px-6 py-24"
        :style="aboutStyle"
      >
        <div class="mx-auto max-w-7xl">
          <div class="grid items-center gap-16 lg:grid-cols-2">
            <div class="overflow-hidden rounded-xl">
              <img
                v-if="aboutImage"
                :src="aboutImage"
                :alt="shopName"
                class="h-full min-h-[400px] w-full object-cover"
              />
              <div
                v-else
                class="flex min-h-[400px] items-center justify-center rounded-xl bg-[#1e293b]"
              >
                <UtensilsCrossed class="size-20 text-white/20" />
              </div>
            </div>
            <div class="max-w-lg">
              <p class="mb-2 font-sans text-sm text-white/40">
                {{ aboutLabel || t('config.landingFugaAbout') }}
              </p>
              <h2 class="mb-6 text-4xl font-bold leading-tight md:text-5xl">
                {{ aboutTitle || t('config.landingFugaAboutTitle') }}
              </h2>
              <p class="mb-8 font-sans text-lg leading-relaxed text-white/60">
                {{ aboutDescription || t('config.landingFugaAboutDesc') }}
              </p>
              <ul class="space-y-4">
                <li
                  v-for="(bullet, idx) in aboutBulletsList"
                  :key="idx"
                  class="flex gap-3 font-sans text-[#f8fafc]"
                >
                  <Check class="mt-1 size-5 shrink-0" :style="{ color: primaryColor }" />
                  <span>{{ bullet }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Why / Features -->
      <section
        v-if="whyEnabled"
        id="features"
        class="landing-fade-up px-6 py-24"
        :style="whyStyle"
      >
        <div class="mx-auto max-w-7xl text-center">
          <p class="mb-2 font-sans text-sm text-white/40">
            {{ whyLabel || t('config.landingFugaWhy') }}
          </p>
          <h2 class="mb-6 text-4xl font-bold leading-tight md:text-5xl">
            {{ whyTitle || t('config.landingFugaWhy') }}
          </h2>
          <p v-if="whyDescription" class="mx-auto mb-16 max-w-2xl font-sans text-lg text-white/60">
            {{ whyDescription }}
          </p>
          <div class="grid gap-8 sm:grid-cols-3">
            <div
              v-for="(feat, idx) in whyFeaturesList"
              :key="feat.title"
              class="landing-stagger rounded-xl border border-white/10 bg-[#1e293b] p-8 text-center transition-all hover:-translate-y-1 hover:shadow-xl"
              :style="{ '--i': idx }"
            >
              <component :is="featureIcons[idx % featureIcons.length]" class="mx-auto mb-5 size-10" :style="{ color: primaryColor }" />
              <h3 class="mb-3 text-xl font-bold">{{ feat.title }}</h3>
              <p class="font-sans text-sm text-white/50">{{ feat.description }}</p>
            </div>
          </div>
          <div v-if="whyStatsList.length > 0" class="mt-16 grid gap-8 rounded-xl border border-white/10 bg-[#1e293b] px-8 py-12 sm:grid-cols-4">
            <div v-for="stat in whyStatsList" :key="stat.label" class="text-center">
              <p class="landing-counter text-4xl font-bold" :style="{ color: primaryColor }">{{ stat.value }}</p>
              <p class="mt-2 font-sans text-sm text-white/50">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Marquee -->
      <div class="landing-marquee overflow-hidden border-y border-white/10 bg-[#1e293b] py-4">
        <div class="flex gap-12 whitespace-nowrap text-sm font-semibold text-white/30">
          <span>{{ t('config.landingFugaMarquee') }}</span>
          <span>✦</span>
          <span>{{ t('config.landingFugaMarquee') }}</span>
          <span>✦</span>
          <span>{{ t('config.landingFugaMarquee') }}</span>
          <span>✦</span>
          <span>{{ t('config.landingFugaMarquee') }}</span>
        </div>
      </div>

      <!-- Menu -->
      <section
        v-if="carouselEnabled && products.length > 0"
        id="menu"
        class="landing-fade-up px-6 py-24"
      >
        <div class="mx-auto max-w-7xl text-center">
          <p class="mb-2 font-sans text-sm text-white/40">
            {{ t('config.landingFugaMenuLabel') }}
          </p>
          <h2 class="mb-12 text-4xl font-bold leading-tight md:text-5xl">
            {{ carouselTitle || t('config.landingFugaMenuTitle') }}
          </h2>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <RouterLink
              v-for="(product, idx) in products.slice(0, carouselMaxItems)"
              :key="product.id"
              to="/order"
              class="landing-stagger group overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all hover:-translate-y-1 hover:shadow-xl"
              :style="{ '--i': idx }"
            >
              <div class="relative h-56 overflow-hidden bg-[#1e293b]">
                <img
                  v-if="product.image_url"
                  :src="product.image_url"
                  :alt="product.name"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div v-else class="flex h-full items-center justify-center">
                  <UtensilsCrossed class="size-14 text-white/20" />
                </div>
              </div>
              <div class="p-6 text-left">
                <h3 class="mb-1 text-lg font-bold">{{ product.name }}</h3>
                <p v-if="product.description" class="mb-3 font-sans text-sm text-white/50 line-clamp-2">
                  {{ product.description }}
                </p>
                <p class="font-sans text-base font-bold" :style="{ color: primaryColor }">
                  {{ `$${(product.price / 100).toFixed(2)}` }}
                </p>
              </div>
            </RouterLink>
          </div>
          <div v-if="products.length > carouselMaxItems" class="mt-12">
            <RouterLink to="/order">
              <Button size="lg" class="h-12 rounded-full px-8 font-sans font-semibold text-white" :style="{ backgroundColor: primaryColor }">
                {{ t('config.landingCarouselViewMore') }}
                <ArrowRight class="ml-2 size-5" />
              </Button>
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- Testimonials -->
      <section
        v-if="testimonialsEnabled && testimonialsData?.length"
        id="testimonials"
        class="landing-fade-up border-t border-white/10 px-6 py-24"
        :style="galleryStyle"
      >
        <div class="mx-auto max-w-4xl text-center">
          <p class="mb-2 font-sans text-sm text-white/40">
            {{ t('config.landingFugaTestimonialsLabel') }}
          </p>
          <h2 class="mb-12 text-4xl font-bold leading-tight md:text-5xl">
            {{ testimonialsTitle || t('config.landingFugaTestimonialsTitle') }}
          </h2>
          <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="(item, idx) in testimonialsData"
              :key="item.name"
              class="landing-stagger rounded-xl border border-white/10 bg-[#1e293b] p-6 text-left"
              :style="{ '--i': idx }"
            >
              <div class="mb-3 flex gap-1">
                <Star v-for="i in 5" :key="i" class="size-4" :class="i <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-white/20'" />
              </div>
              <p class="mb-4 font-sans text-sm leading-relaxed text-white/60">&ldquo;{{ item.text }}&rdquo;</p>
              <p class="text-sm font-bold">{{ item.name }}</p>
              <p v-if="item.role" class="font-sans text-xs text-white/40">{{ item.role }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Services -->
      <section
        v-if="servicesEnabled && servicesData?.length"
        id="services"
        class="landing-fade-up px-6 py-24"
        :style="servicesStyle"
      >
        <div class="mx-auto max-w-7xl text-center">
          <p class="mb-2 font-sans text-sm text-white/40">
            {{ t('config.landingFugaServicesLabel') }}
          </p>
          <h2 class="mb-3 text-4xl font-bold leading-tight md:text-5xl">
            {{ servicesTitle || t('config.landingFugaServicesTitle') }}
          </h2>
          <p v-if="servicesSubtitle" class="mx-auto mb-12 max-w-2xl font-sans text-white/60">
            {{ servicesSubtitle }}
          </p>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="(item, idx) in servicesData"
              :key="idx"
              class="landing-stagger group overflow-hidden rounded-xl border border-white/10 bg-[#1e293b] text-left transition-all hover:-translate-y-1 hover:shadow-xl"
              :style="{ '--i': idx }"
            >
              <div class="relative h-48 overflow-hidden">
                <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  :alt="item.title"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div v-else class="flex h-full items-center justify-center">
                  <Sparkles class="size-12 text-white/20" />
                </div>
                <div class="absolute right-3 bottom-3 rounded-full bg-white/90 px-4 py-1.5 font-sans text-sm font-bold text-[#0f172a]">
                  {{ item.price }}
                </div>
              </div>
              <div class="p-6">
                <h3 class="mb-2 text-lg font-bold text-white">{{ item.title }}</h3>
                <p class="font-sans text-sm text-white/50">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Gallery -->
      <section
        v-if="galleryEnabled && galleryImages?.length"
        id="gallery"
        class="landing-fade-up px-6 py-24"
        :style="galleryStyle"
      >
        <div class="mx-auto max-w-7xl text-center">
          <p class="mb-2 font-sans text-sm text-white/40">
            {{ t('config.landingFugaGalleryLabel') }}
          </p>
          <h2 class="mb-12 text-4xl font-bold leading-tight md:text-5xl">
            {{ galleryTitle || t('config.landingFugaGalleryTitle') }}
          </h2>
          <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div
              v-for="(url, idx) in galleryImages"
              :key="idx"
              class="landing-stagger group relative aspect-square overflow-hidden rounded-xl bg-[#1e293b]"
              :style="{ '--i': idx }"
            >
              <img :src="url" :alt="`Gallery ${idx + 1}`" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </div>
          </div>
        </div>
      </section>

      <!-- Contact -->
      <section
        v-if="contactEnabled"
        id="contact"
        class="landing-fade-up px-6 py-24"
        :style="contactStyle"
      >
        <div class="mx-auto max-w-7xl">
          <div class="text-center">
            <p class="mb-2 font-sans text-sm text-white/40">
              {{ t('config.landingFugaContactLabel') }}
            </p>
            <h2 class="mb-12 text-4xl font-bold leading-tight md:text-5xl">
              {{ contactTitle || t('config.landingFugaContactTitle') }}
            </h2>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div v-if="contactAddress || shopAddress" class="rounded-xl border border-white/10 bg-[#1e293b] p-6 text-center">
              <MapPin class="mx-auto mb-3 size-6" :style="{ color: primaryColor }" />
              <p class="font-sans text-sm text-white/60">{{ contactAddress || shopAddress }}</p>
            </div>
            <div v-if="contactPhone || shopPhone" class="rounded-xl border border-white/10 bg-[#1e293b] p-6 text-center">
              <Phone class="mx-auto mb-3 size-6" :style="{ color: primaryColor }" />
              <p class="font-sans text-sm text-white/60">{{ contactPhone || shopPhone }}</p>
            </div>
            <div v-if="contactEmail" class="rounded-xl border border-white/10 bg-[#1e293b] p-6 text-center">
              <Mail class="mx-auto mb-3 size-6" :style="{ color: primaryColor }" />
              <p class="font-sans text-sm text-white/60">{{ contactEmail }}</p>
            </div>
            <div class="rounded-xl border border-white/10 bg-[#1e293b] p-6 text-center">
              <Clock class="mx-auto mb-3 size-6" :style="{ color: primaryColor }" />
              <p class="font-sans text-sm text-white/60">{{ t('config.landingDefaultHours') }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="landing-fade-up border-t border-white/10 px-6 py-24 text-center" :style="{ backgroundColor: primaryColor }">
        <h2 class="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl">
          {{ t('config.landingFugaCta') }}
        </h2>
        <p class="mx-auto mb-10 max-w-xl font-sans text-lg text-white/80">
          {{ t('config.landingFugaCtaDesc') }}
        </p>
        <RouterLink to="/order">
          <Button size="lg" class="h-12 rounded-full border-2 border-white/30 bg-transparent px-8 font-sans text-base font-semibold text-white hover:bg-white/10">
            {{ t('nav.createTransaction') }}
            <ArrowRight class="ml-2 size-5" />
          </Button>
        </RouterLink>
      </section>

      <!-- Footer -->
      <footer class="border-t border-white/10 bg-[#0c1222] px-6 py-10">
        <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 font-sans text-xs text-white/40 sm:flex-row">
          <p>&copy; {{ shopName }}. {{ t('config.landingFugaCopyright') }}</p>
          <div class="flex gap-8">
            <RouterLink to="/order" class="tracking-wider uppercase hover:text-white/80">{{ t('nav.createTransaction') }}</RouterLink>
            <RouterLink to="/book" class="tracking-wider uppercase hover:text-white/80">{{ t('nav.bookings') }}</RouterLink>
          </div>
        </div>
      </footer>
    </div>
  </ApplicationLayout>
</template>
