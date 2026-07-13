<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowDown, Sparkles, Check, UtensilsCrossed, ExternalLink, MapPin, Phone, Mail, Clock } from '@lucide/vue'
import ApplicationLayout from '@/layouts/ApplicationLayout.vue'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/composables/useI18n'
import { landingSectionStyle } from '@/lib/landing-section-style'
import SpiceHavenNav from '@/components/landing/spicehaven/SpiceHavenNav.vue'
import SpiceHavenMenuIntro from '@/components/landing/spicehaven/SpiceHavenMenuIntro.vue'
import SpiceHavenStorySection from '@/components/landing/spicehaven/SpiceHavenStorySection.vue'
import SpiceHavenQuoteSection from '@/components/landing/spicehaven/SpiceHavenQuoteSection.vue'
import SpiceHavenMenuGrid from '@/components/landing/spicehaven/SpiceHavenMenuGrid.vue'
import SpiceHavenMomentsGallery from '@/components/landing/spicehaven/SpiceHavenMomentsGallery.vue'
import type { LandingPageProps } from '@/components/landing/landing-page-props'

const props = defineProps<Omit<LandingPageProps, 'template'>>()

const { t } = useI18n()

const displaySubtitle = computed(() => props.heroSubtitle || t('config.landingSpiceHavenHero'))
const heroHeadline = computed(() => props.heroTitle || t('config.landingSpiceHavenHeroHeadline'))
const displayTagline = computed(() => props.heroTagline || t('config.landingSpiceHavenTagline'))

const heroStyle = computed(() => {
  if (props.heroBgImage?.trim()) {
    return landingSectionStyle(props.heroBgImage, props.heroBgColor || '#1c1917')
  }
  const c = props.primaryColor
  return {
    background: `linear-gradient(160deg, #1c1917 0%, color-mix(in srgb, ${c} 40%, #1c1917) 50%, #292524 100%)`,
  }
})

const storyFeatures = computed(() => {
  if (props.whyFeatures?.length) return props.whyFeatures
  return [
    { title: t('config.landingSpiceHavenFeat1Title'), description: t('config.landingSpiceHavenFeat1Desc') },
    { title: t('config.landingSpiceHavenFeat2Title'), description: t('config.landingSpiceHavenFeat2Desc') },
    { title: t('config.landingSpiceHavenFeat3Title'), description: t('config.landingSpiceHavenFeat3Desc') },
  ]
})

const firstTestimonial = computed(() => props.testimonialsData?.[0] ?? null)
const aboutImage = computed(() => props.aboutImageUrl || props.heroImageUrl)
const aboutStyle = computed(() => landingSectionStyle(props.aboutBgImage, props.aboutBgColor || '#0c0a09'))
const servicesStyle = computed(() => landingSectionStyle(props.servicesBgImage, props.servicesBgColor || '#1c1917'))
const contactStyle = computed(() => landingSectionStyle(props.contactBgImage, props.contactBgColor || '#0c0a09'))

const aboutBulletsList = computed(() => {
  if (props.aboutBullets?.length) return props.aboutBullets
  return [
    t('config.landingSpiceHavenAboutBullet1'),
    t('config.landingSpiceHavenAboutBullet2'),
    t('config.landingSpiceHavenAboutBullet3'),
  ]
})

const hasServicesWhatsapp = computed(() => !!props.servicesWhatsapp)

function servicesWaLink(text: string) {
  const number = props.servicesWhatsapp?.replace(/[^0-9]/g, '') ?? ''
  const msg = encodeURIComponent(`Halo, saya tertarik dengan layanan: ${text}`)
  return `https://wa.me/${number}?text=${msg}`
}
</script>

<template>
  <ApplicationLayout>
    <div class="w-full bg-stone-950 text-amber-50">
      <div class="landing-scroll-progress fixed top-0 right-0 left-0 z-[60] h-0.5 origin-left scale-x-0" :style="{ backgroundColor: primaryColor }" />
      <section id="hero" class="landing-fade-in relative flex min-h-screen flex-col">
        <div
          v-if="heroImageUrl && !heroBgImage"
          class="landing-parallax absolute inset-0 bg-cover bg-center"
          :style="{ backgroundImage: `url(${heroImageUrl})` }"
        />
        <div v-else class="landing-parallax absolute inset-0" :style="heroStyle" />
        <div class="absolute inset-0 bg-stone-950/60" />
        <SpiceHavenNav :shop-name="shopName" :accent-color="primaryColor" :nav-logo-url="navLogoUrl" />
        <div class="landing-hero-choreo landing-fade-up landing-delay-1 relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
          <p v-if="displayTagline" class="mb-4 text-sm font-semibold text-amber-400">
            {{ displayTagline }}
          </p>
          <h1 class="landing-text-reveal max-w-4xl font-serif text-5xl leading-tight font-light whitespace-pre-line md:text-6xl lg:text-7xl">
            {{ heroHeadline }}
          </h1>
          <p class="mt-6 max-w-2xl text-lg text-amber-100/70">
            {{ displaySubtitle }}
          </p>
          <RouterLink to="/order" class="mt-10">
            <Button
              size="lg"
              variant="outline"
              class="h-12 rounded-none border-amber-400/50 px-10 tracking-widest text-amber-50 uppercase hover:bg-amber-400/10"
            >
              {{ t('config.landingSpiceHavenOrder') }}
            </Button>
          </RouterLink>
          <ArrowDown class="mt-16 size-6 animate-pulse text-amber-400/60" />
        </div>
      </section>

      <section
        v-if="aboutEnabled"
        id="about"
        class="landing-fade-up border-y border-amber-900/30 px-6 py-20"
        :style="aboutStyle"
      >
        <div class="mx-auto max-w-6xl">
          <p class="mb-2 text-center text-sm text-amber-500">
            {{ aboutLabel || t('config.landingSpiceHavenAbout') }}
          </p>
          <h2 class="mb-6 text-center font-serif text-3xl text-amber-50 md:text-4xl">
            {{ aboutTitle || t('config.landingSpiceHavenAboutTitle') }}
          </h2>
          <div class="grid items-center gap-12 lg:grid-cols-2">
            <div class="overflow-hidden rounded-lg">
              <img
                v-if="aboutImage"
                :src="aboutImage"
                :alt="shopName"
                class="h-full min-h-[300px] w-full object-cover"
              />
              <div
                v-else
                class="flex min-h-[300px] items-center justify-center rounded-lg bg-stone-800"
              >
                <UtensilsCrossed class="size-16 text-stone-600" />
              </div>
            </div>
            <div>
              <p class="mb-6 leading-relaxed text-amber-100/70">
                {{ aboutDescription || t('config.landingSpiceHavenAboutDesc') }}
              </p>
              <ul class="space-y-3">
                <li
                  v-for="(bullet, idx) in aboutBulletsList"
                  :key="idx"
                  class="flex gap-3 text-sm text-amber-100/60"
                >
                  <Check class="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <span>{{ bullet }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <SpiceHavenMenuIntro
        :subtitle="displaySubtitle"
        :image-url="aboutImageUrl || heroImageUrl"
        :shop-name="shopName"
        :bg-color="aboutBgColor || '#0c0a09'"
        :bg-image="aboutBgImage"
      />

      <SpiceHavenStorySection
        v-if="whyEnabled !== false"
        :label="whyLabel"
        :title="whyTitle"
        :description="whyDescription"
        :features="storyFeatures"
        :bg-color="whyBgColor || '#1c1917'"
        :bg-image="whyBgImage"
      />

      <SpiceHavenQuoteSection
        :testimonial="firstTestimonial"
        :fallback-quote="t('config.landingSpiceHavenQuote')"
        :fallback-author="'Google Review'"
        :bg-color="testimonialsBgColor || '#0c0a09'"
        :bg-image="testimonialsBgImage"
      />

      <section
        v-if="servicesEnabled"
        id="services"
        class="landing-fade-up px-6 py-20"
        :style="servicesStyle"
      >
        <div class="mx-auto max-w-6xl">
          <p class="mb-2 text-center text-sm text-amber-500">
            {{ t('config.landingSpiceHavenServices') }}
          </p>
          <h2 class="mb-3 text-center font-serif text-3xl text-amber-50">
            {{ servicesTitle || t('config.landingSpiceHavenServicesTitle') }}
          </h2>
          <p v-if="servicesSubtitle" class="mb-10 text-center text-sm text-amber-100/50">{{ servicesSubtitle }}</p>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="(item, idx) in servicesData ?? []"
              :key="idx"
              class="group border border-amber-900/20 bg-stone-900/50 transition-colors hover:border-amber-500/40"
            >
              <div class="relative h-48 overflow-hidden bg-stone-800">
                <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  :alt="item.title"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div v-else class="flex h-full items-center justify-center">
                  <UtensilsCrossed class="size-10 text-stone-600" />
                </div>
                <div class="absolute right-0 bottom-0 rounded-tl-xl bg-amber-600 px-4 py-2 text-lg font-bold text-white">
                  {{ item.price }}
                </div>
              </div>
              <div class="p-5 text-center">
                <h3 class="mb-2 font-serif text-lg text-amber-50">{{ item.title }}</h3>
                <p class="mb-3 text-sm leading-relaxed text-amber-100/50">{{ item.description }}</p>
                <a
                  v-if="hasServicesWhatsapp && item.title"
                  :href="servicesWaLink(item.title)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 text-sm font-semibold tracking-widest text-amber-400 uppercase hover:text-amber-300"
                >
                  {{ t('config.landingServicesCta') }}
                  <ExternalLink class="size-3.5" />
                </a>
              </div>
            </div>
          </div>
          <p v-if="!servicesData?.length" class="py-8 text-center text-sm text-amber-100/40">{{ t('config.landingServicesEmpty') }}</p>
        </div>
      </section>

      <SpiceHavenMenuGrid
        v-if="carouselEnabled"
        :products="products"
        :max-items="carouselMaxItems"
        :title="carouselTitle"
        :accent-color="primaryColor"
        :bg-color="carouselBgColor || '#0c0a09'"
        :bg-image="carouselBgImage"
      />

      <SpiceHavenMomentsGallery
        v-if="galleryEnabled"
        :images="galleryImages ?? []"
        :title="galleryTitle"
        :subtitle="gallerySubtitle"
        :bg-color="galleryBgColor || '#0c0a09'"
        :bg-image="galleryBgImage"
      />

      <section
        v-if="contactEnabled"
        id="contact"
        class="landing-fade-up border-t border-amber-900/30 px-6 py-20"
        :style="contactStyle"
      >
        <div class="mx-auto max-w-6xl">
          <p class="mb-2 text-center text-sm text-amber-500">
            {{ t('config.landingContactLabel') }}
          </p>
          <h2 class="mb-10 text-center font-serif text-3xl text-amber-50">
            {{ contactTitle || t('config.landingSpiceHavenContactTitle') }}
          </h2>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div v-if="contactAddress || shopAddress" class="flex flex-col items-center gap-3 rounded-lg border border-amber-900/20 bg-stone-900/50 p-6 text-center">
              <MapPin class="size-6 text-amber-500" />
              <p class="text-sm text-amber-100/70">{{ contactAddress || shopAddress }}</p>
            </div>
            <div v-if="contactPhone || shopPhone" class="flex flex-col items-center gap-3 rounded-lg border border-amber-900/20 bg-stone-900/50 p-6 text-center">
              <Phone class="size-6 text-amber-500" />
              <p class="text-sm text-amber-100/70">{{ contactPhone || shopPhone }}</p>
            </div>
            <div v-if="contactEmail" class="flex flex-col items-center gap-3 rounded-lg border border-amber-900/20 bg-stone-900/50 p-6 text-center">
              <Mail class="size-6 text-amber-500" />
              <p class="text-sm text-amber-100/70">{{ contactEmail }}</p>
            </div>
            <div class="flex flex-col items-center gap-3 rounded-lg border border-amber-900/20 bg-stone-900/50 p-6 text-center">
              <Clock class="size-6 text-amber-500" />
              <p class="text-sm text-amber-100/70">{{ t('config.landingContactHours') }}</p>
            </div>
          </div>
        </div>
      </section>

      <footer class="border-t border-amber-900/30 bg-stone-950 px-6 py-10">
        <div class="mx-auto max-w-6xl text-center">
          <p class="font-serif text-xl font-semibold tracking-widest text-amber-400 uppercase">{{ shopName }}</p>
          <p class="mt-2 text-sm text-amber-100/50">{{ t('config.landingSpiceHavenSubtitle') }}</p>
          <div class="mt-6 flex flex-wrap justify-center gap-6 text-xs tracking-widest text-amber-100/40 uppercase">
            <RouterLink to="/" class="hover:text-amber-400">{{ t('config.landingSpiceHavenNavHome') }}</RouterLink>
            <RouterLink to="/order" class="hover:text-amber-400">{{ t('config.landingSpiceHavenOrder') }}</RouterLink>
            <RouterLink to="/book" class="hover:text-amber-400">{{ t('nav.bookings') }}</RouterLink>
          </div>
          <p class="mt-6 text-xs text-amber-100/30">&copy; {{ shopName }}. {{ t('config.landingYummyCopyright') }}</p>
        </div>
      </footer>
    </div>
  </ApplicationLayout>
</template>
