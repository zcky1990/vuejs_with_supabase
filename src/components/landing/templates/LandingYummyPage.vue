<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRight,
  UtensilsCrossed,
  ChefHat,
  Users,
  Star,
  Check,
  MapPin,
  Phone,
  Mail,
  Clock,
} from '@lucide/vue'
import ApplicationLayout from '@/layouts/ApplicationLayout.vue'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/composables/useI18n'
import { landingSectionStyle } from '@/lib/landing-section-style'
import YummyNav from '@/components/landing/yummy/YummyNav.vue'
import YummySectionHeading from '@/components/landing/yummy/YummySectionHeading.vue'
import YummyMenuSection from '@/components/landing/yummy/YummyMenuSection.vue'
import YummyTestimonialsSection from '@/components/landing/yummy/YummyTestimonialsSection.vue'
import YummyEventsSection from '@/components/landing/yummy/YummyEventsSection.vue'
import YummyGallerySection from '@/components/landing/yummy/YummyGallerySection.vue'
import YummyContactSection from '@/components/landing/yummy/YummyContactSection.vue'
import type { LandingPageProps } from '@/components/landing/landing-page-props'

const props = defineProps<Omit<LandingPageProps, 'template'>>()

const { t } = useI18n()

const displayTitle = computed(() => props.heroTitle || t('config.landingYummyHero'))
const displaySubtitle = computed(() => props.heroSubtitle || t('config.landingYummyHeroDesc'))
const displayTagline = computed(() => props.heroTagline || t('config.landingYummyHeroLine2'))
const menuCount = computed(() => props.products.length)
const phoneDisplay = computed(() => props.contactPhone || props.shopPhone || '')
const aboutImage = computed(() => props.aboutImageUrl || props.heroImageUrl)

const aboutBulletsList = computed(() => {
  if (props.aboutBullets?.length) return props.aboutBullets
  return [
    t('config.landingYummyAboutBullet1'),
    t('config.landingYummyAboutBullet2'),
    t('config.landingYummyAboutBullet3'),
  ]
})

const whyFeaturesList = computed(() => {
  if (props.whyFeatures?.length) return props.whyFeatures
  return [
    { title: t('config.landingYummyFeat1Title'), description: t('config.landingYummyFeat1Desc') },
    { title: t('config.landingYummyFeat2Title'), description: t('config.landingYummyFeat2Desc') },
    { title: t('config.landingYummyFeat3Title'), description: t('config.landingYummyFeat3Desc') },
  ]
})

const whyStatsList = computed(() => {
  if (props.whyStats?.length) {
    return props.whyStats.map((stat) => ({
      value: stat.value === '{menuCount}' ? `${menuCount.value}+` : stat.value,
      label: stat.label,
    }))
  }
  return [
    { value: '850+', label: t('config.landingYummyStat1') },
    { value: `${menuCount.value}+`, label: t('config.landingYummyStat2') },
    { value: '15+', label: t('config.landingYummyStat3') },
    { value: '12', label: t('config.landingYummyStat4') },
  ]
})

const featureIcons = [ChefHat, Users, Star]

const heroStyle = computed(() => landingSectionStyle(props.heroBgImage, props.heroBgColor))
const aboutStyle = computed(() => landingSectionStyle(props.aboutBgImage, props.aboutBgColor))
const whyStyle = computed(() => landingSectionStyle(props.whyBgImage, props.whyBgColor))
const bookStyle = computed(() => landingSectionStyle(props.bookBgImage, props.bookBgColor || props.primaryColor))
</script>

<template>
  <ApplicationLayout>
    <div class="yummy-page w-full bg-[#f9f9f9] text-slate-700">
      <div class="landing-scroll-progress fixed top-0 right-0 left-0 z-[60] h-0.5 origin-left scale-x-0" :style="{ backgroundColor: primaryColor }" />
      <YummyNav :shop-name="shopName" :accent-color="primaryColor" :nav-logo-url="navLogoUrl" />

      <!-- Hero: light background like Yummy Red -->
      <section id="hero" class="landing-fade-in relative overflow-hidden px-6 py-16 md:py-24" :style="heroStyle">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,color-mix(in_srgb,var(--yummy-accent)_8%,transparent)_0%,transparent_50%)]" />
        <div class="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:gap-16">
          <div class="landing-hero-choreo landing-fade-up landing-delay-1 flex-1 text-center lg:text-left">
            <h1 class="landing-text-reveal mb-4 text-4xl leading-tight font-bold text-slate-800 md:text-5xl lg:text-6xl">
              {{ displayTitle }}<br />
              <span :style="{ color: primaryColor }">{{ displayTagline }}</span>
            </h1>
            <p class="mb-8 max-w-lg text-base leading-relaxed text-slate-500 md:text-lg">
              {{ displaySubtitle }}
            </p>
            <div class="flex flex-wrap justify-center gap-3 lg:justify-start">
              <RouterLink to="/book">
                <Button
                  size="lg"
                  class="h-12 rounded-full px-8 font-semibold shadow-sm"
                  :style="{ backgroundColor: primaryColor, color: '#fff' }"
                >
                  {{ t('config.landingYummyBookTable') }}
                </Button>
              </RouterLink>
              <RouterLink to="/order">
                <Button
                  variant="outline"
                  size="lg"
                  class="h-12 rounded-full border-slate-300 px-8 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {{ t('nav.createTransaction') }}
                  <ArrowRight class="ml-2 size-5" />
                </Button>
              </RouterLink>
            </div>
          </div>
          <div class="landing-fade-up landing-delay-2 flex-1">
            <img
              v-if="heroImageUrl"
              :src="heroImageUrl"
              :alt="displayTitle"
              class="mx-auto w-full max-w-lg rounded-lg object-cover shadow-xl"
            />
            <div
              v-else
              class="mx-auto flex aspect-[4/3] w-full max-w-lg items-center justify-center rounded-lg bg-slate-100 shadow-xl"
            >
              <UtensilsCrossed class="size-20 text-slate-300" />
            </div>
          </div>
        </div>
      </section>

      <!-- About Us -->
      <section
        v-if="aboutEnabled"
        id="about"
        class="landing-fade-up px-6 py-20"
        :style="aboutStyle"
      >
        <div class="mx-auto max-w-6xl">
          <YummySectionHeading
            :label="aboutLabel || t('config.landingYummyAbout')"
            :title="aboutTitle || t('config.landingYummyAboutTitle')"
            :accent-color="primaryColor"
          />
          <div class="grid items-center gap-12 lg:grid-cols-2">
            <div class="overflow-hidden rounded-lg">
              <img
                v-if="aboutImage"
                :src="aboutImage"
                :alt="shopName"
                class="h-full min-h-[320px] w-full object-cover"
              />
              <div
                v-else
                class="flex min-h-[320px] items-center justify-center bg-slate-100"
              >
                <UtensilsCrossed class="size-16 text-slate-300" />
              </div>
            </div>
            <div>
              <p class="mb-6 leading-relaxed text-slate-600">
                {{ aboutDescription || t('config.landingYummyAboutDesc') }}
              </p>
              <div
                class="inline-block rounded-lg border-2 px-6 py-4 text-center"
                :style="{ borderColor: primaryColor }"
              >
                <h3 class="text-lg font-bold" :style="{ color: primaryColor }">
                  {{ t('config.landingYummyBookTable') }}
                </h3>
                <p v-if="phoneDisplay" class="mt-1 text-2xl font-bold text-slate-800">
                  {{ phoneDisplay }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Why Choose -->
      <section
        v-if="whyEnabled"
        id="why-choose"
        class="landing-fade-up px-6 py-20"
        :style="whyStyle"
      >
        <div class="mx-auto max-w-6xl">
          <div class="mb-12 grid items-start gap-10 lg:grid-cols-2">
            <div>
              <p class="mb-2 text-sm font-semibold" :style="{ color: primaryColor }">
                {{ whyLabel || t('config.landingYummyWhyChoose') }}
              </p>
              <h2 class="yummy-font-display mb-4 text-3xl font-bold text-slate-800">
                {{ whyTitle || t('config.landingYummyWhyChoose') }}
              </h2>
              <p class="mb-6 leading-relaxed text-slate-600">
                {{ whyDescription || t('config.landingYummyWhyChooseDesc') }}
              </p>
              <RouterLink to="/order">
                <span
                  class="inline-flex items-center gap-2 text-sm font-semibold"
                  :style="{ color: primaryColor }"
                >
                  {{ t('config.landingYummyLearnMore') }}
                  <ArrowRight class="size-4" />
                </span>
              </RouterLink>
            </div>
            <div class="grid gap-4 sm:grid-cols-3">
              <div
                v-for="(feature, idx) in whyFeaturesList"
                :key="idx"
                class="landing-stagger rounded-lg bg-white p-5 text-center shadow-sm"
                :style="{ '--i': idx }"
              >
                <component
                  :is="featureIcons[idx % featureIcons.length]"
                  class="mx-auto mb-3 size-8"
                  :style="{ color: primaryColor }"
                />
                <h3 class="mb-2 text-sm font-bold text-slate-800">{{ feature.title }}</h3>
                <p class="text-xs leading-relaxed text-slate-500">{{ feature.description }}</p>
              </div>
            </div>
          </div>

          <div class="landing-fade-up grid grid-cols-2 gap-6 rounded-lg bg-white px-6 py-10 shadow-sm md:grid-cols-4">
            <div v-for="stat in whyStatsList" :key="stat.label" class="text-center">
              <p class="landing-counter text-3xl font-bold md:text-4xl" :style="{ color: primaryColor }">{{ stat.value }}</p>
              <p class="mt-2 text-sm text-slate-500">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Menu -->
      <YummyMenuSection
        v-if="carouselEnabled"
        :products="products"
        :max-items="carouselMaxItems"
        :accent-color="primaryColor"
        :title="carouselTitle"
        :bg-color="carouselBgColor"
        :bg-image="carouselBgImage"
      />

      <!-- Testimonials -->
      <YummyTestimonialsSection
        v-if="testimonialsEnabled"
        :testimonials="testimonialsData ?? []"
        :accent-color="primaryColor"
        :title="testimonialsTitle"
        :bg-color="testimonialsBgColor"
        :bg-image="testimonialsBgImage"
      />

      <!-- Events / Services -->
      <YummyEventsSection
        v-if="servicesEnabled"
        :items="servicesData ?? []"
        :accent-color="primaryColor"
        :title="servicesTitle"
        :subtitle="servicesSubtitle"
        :whatsapp-number="servicesWhatsapp"
        :bg-color="servicesBgColor"
        :bg-image="servicesBgImage"
      />

      <!-- Book A Table -->
      <section id="book" class="landing-fade-up px-6 py-20" :style="bookStyle">
        <div class="mx-auto max-w-3xl text-center">
          <YummySectionHeading
            :label="t('config.landingYummyBookSectionTitle')"
            :title="t('config.landingYummyBookSectionDesc')"
            :accent-color="'#ffffff'"
            light
          />
          <RouterLink to="/book">
            <Button size="lg" class="mt-4 h-12 rounded-full bg-white px-10 font-semibold text-slate-800 hover:bg-red-50">
              {{ t('config.landingYummyBookTable') }}
              <ArrowRight class="ml-2 size-5" />
            </Button>
          </RouterLink>
        </div>
      </section>

      <!-- Gallery -->
      <YummyGallerySection
        v-if="galleryEnabled"
        :images="galleryImages ?? []"
        :accent-color="primaryColor"
        :title="galleryTitle"
        :subtitle="gallerySubtitle"
        :bg-color="galleryBgColor"
        :bg-image="galleryBgImage"
      />

      <!-- Contact -->
      <YummyContactSection
        v-if="contactEnabled"
        :accent-color="primaryColor"
        :title="contactTitle"
        :subtitle="contactSubtitle"
        :address="contactAddress || shopAddress || null"
        :phone="contactPhone || shopPhone || null"
        :email="contactEmail"
        :map-lat="contactMapLat"
        :map-lng="contactMapLng"
        :map-zoom="contactMapZoom"
        :bg-color="contactBgColor"
        :bg-image="contactBgImage"
      />

      <!-- Footer -->
      <footer class="landing-fade-up bg-slate-900 px-6 py-14 text-slate-300">
        <div class="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 class="mb-4 font-bold text-white">{{ t('config.landingContactAddress') }}</h4>
            <p class="flex gap-2 text-sm leading-relaxed">
              <MapPin class="mt-0.5 size-4 shrink-0" :style="{ color: primaryColor }" />
              {{ contactAddress || shopAddress || '—' }}
            </p>
          </div>
          <div>
            <h4 class="mb-4 font-bold text-white">{{ t('config.landingContactLabel') }}</h4>
            <p v-if="phoneDisplay" class="mb-2 flex gap-2 text-sm">
              <Phone class="size-4 shrink-0" :style="{ color: primaryColor }" />
              {{ phoneDisplay }}
            </p>
            <p v-if="contactEmail" class="flex gap-2 text-sm">
              <Mail class="size-4 shrink-0" :style="{ color: primaryColor }" />
              {{ contactEmail }}
            </p>
          </div>
          <div>
            <h4 class="mb-4 font-bold text-white">{{ t('config.landingDefaultHours') }}</h4>
            <p class="flex gap-2 text-sm">
              <Clock class="size-4 shrink-0" :style="{ color: primaryColor }" />
              {{ t('config.landingYummyOpeningHours') }}
            </p>
          </div>
          <div>
            <h4 class="mb-4 font-bold text-white">{{ t('config.landingYummyFollowUs') }}</h4>
            <div class="flex gap-3">
              <RouterLink to="/order" class="text-sm hover:text-white">{{ t('nav.createTransaction') }}</RouterLink>
              <RouterLink to="/book" class="text-sm hover:text-white">{{ t('nav.bookings') }}</RouterLink>
            </div>
          </div>
        </div>
        <div class="mx-auto mt-10 max-w-6xl border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
          &copy; {{ shopName }}. {{ t('config.landingYummyCopyright') }}
        </div>
      </footer>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
.yummy-page {
  --yummy-accent: v-bind(primaryColor);
  font-family: 'Open Sans', 'Inter', system-ui, sans-serif;
}

.yummy-logo {
  font-family: 'Amatic SC', cursive;
}

.yummy-font-display,
.yummy-page h1 {
  font-family: 'Amatic SC', cursive;
  letter-spacing: 0.02em;
}
</style>

<style>
@import url('https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=Open+Sans:wght@400;500;600;700&display=swap');
</style>
