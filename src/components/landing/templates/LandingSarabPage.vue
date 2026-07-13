<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, UtensilsCrossed, Clock, MapPin, Phone, Mail, Zap, Award, Leaf } from '@lucide/vue'
import ApplicationLayout from '@/layouts/ApplicationLayout.vue'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/composables/useI18n'
import { landingSectionStyle } from '@/lib/landing-section-style'
import SarabNav from '@/components/landing/sarab/SarabNav.vue'
import SarabSectionHeading from '@/components/landing/sarab/SarabSectionHeading.vue'
import SarabCategorySection from '@/components/landing/sarab/SarabCategorySection.vue'
import SarabOfferSection from '@/components/landing/sarab/SarabOfferSection.vue'
import SarabConfigurableSections from '@/components/landing/sarab/SarabConfigurableSections.vue'
import type { LandingPageProps } from '@/components/landing/landing-page-props'

const props = defineProps<Omit<LandingPageProps, 'template'>>()

const { t } = useI18n()

const displayTitle = computed(() => props.heroTitle || props.shopName)
const displaySubtitle = computed(() => props.heroSubtitle || t('config.landingSarabHero'))
const displayTagline = computed(() => props.heroTagline || t('config.landingSarabTagline'))
const menuCount = computed(() => props.products.length)

const heroStyle = computed(() => landingSectionStyle(props.heroBgImage, props.heroBgColor || '#09090b'))
const aboutStyle = computed(() => landingSectionStyle(props.aboutBgImage, props.aboutBgColor || '#18181b'))
const whyStyle = computed(() => landingSectionStyle(props.whyBgImage, props.whyBgColor || '#18181b'))

const whyFeaturesList = computed(() => {
  if (props.whyFeatures?.length) return props.whyFeatures
  return [
    { title: t('config.landingSarabFeat1Title'), description: t('config.landingSarabFeat1Desc') },
    { title: t('config.landingSarabFeat2Title'), description: t('config.landingSarabFeat2Desc') },
    { title: t('config.landingSarabFeat3Title'), description: t('config.landingSarabFeat3Desc') },
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
    { value: '12 yr', label: t('config.landingYummyStat4') },
  ]
})

const featureIcons = [Leaf, Zap, Award]
const categoryBgColor = computed(() => props.carouselBgColor || '#09090b')
</script>

<template>
  <ApplicationLayout>
    <div class="w-full bg-zinc-950 text-white">
      <div class="landing-scroll-progress fixed top-0 right-0 left-0 z-[60] h-0.5 origin-left scale-x-0" :style="{ backgroundColor: primaryColor }" />
      <section id="hero" class="landing-fade-in relative overflow-hidden" :style="heroStyle">
        <div class="landing-parallax absolute inset-0 bg-gradient-to-br from-zinc-950/80 via-zinc-900/60 to-orange-950/30" />
        <SarabNav :shop-name="shopName" :accent-color="primaryColor" :nav-logo-url="navLogoUrl" />
        <div class="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 py-20 lg:flex-row lg:py-28">
          <div class="landing-hero-choreo landing-fade-up landing-delay-1 flex-1 text-center lg:text-left">
            <p class="mb-3 text-sm font-semibold tracking-widest text-orange-400 uppercase">
              {{ displayTagline }}
            </p>
            <h1 class="mb-6 text-4xl leading-tight font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              {{ displayTitle }}
            </h1>
            <p class="mb-10 max-w-xl text-lg leading-relaxed text-zinc-400">
              {{ displaySubtitle }}
            </p>
            <div class="flex flex-wrap justify-center gap-4 lg:justify-start">
              <RouterLink to="/order">
                <Button
                  size="lg"
                  class="h-12 rounded-full px-8 font-semibold"
                  :style="{ backgroundColor: primaryColor, color: '#fff' }"
                >
                  {{ t('config.landingSarabOrderNow') }}
                </Button>
              </RouterLink>
              <RouterLink to="/book">
                <Button variant="outline" size="lg" class="h-12 rounded-full border-zinc-600 px-8 text-white hover:bg-zinc-800">
                  {{ t('nav.bookings') }}
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
              class="mx-auto w-full max-w-lg rounded-2xl object-cover shadow-2xl ring-2 ring-orange-500/30"
            />
            <div
              v-else
              class="mx-auto flex aspect-[4/3] w-full max-w-lg items-center justify-center rounded-2xl bg-zinc-800 ring-2 ring-orange-500/30"
            >
              <UtensilsCrossed class="size-20 text-zinc-600" />
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="aboutEnabled"
        id="about"
        class="landing-fade-up px-6 py-20"
        :style="aboutStyle"
      >
        <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <SarabSectionHeading
              :label="aboutLabel || t('config.landingYummyAbout')"
              :title="aboutTitle || t('config.landingYummyAboutTitle')"
            />
            <p class="-mt-6 text-zinc-400">
              {{ aboutDescription || t('config.landingYummyAboutDesc') }}
            </p>
          </div>
          <img
            v-if="aboutImageUrl || heroImageUrl"
            :src="aboutImageUrl || heroImageUrl!"
            :alt="aboutTitle || shopName"
            class="rounded-2xl object-cover shadow-xl ring-1 ring-zinc-800"
          />
        </div>
      </section>

      <section
        v-if="whyEnabled !== false"
        class="landing-fade-up border-y border-zinc-800 px-6 py-16"
        :style="whyStyle"
      >
        <div class="mx-auto max-w-6xl">
          <SarabSectionHeading
            :label="whyLabel || t('config.landingSarabFeatures')"
            :title="whyTitle || t('config.landingSarabFeatures')"
          />
          <p v-if="whyDescription" class="-mt-6 mb-8 text-center text-zinc-400">{{ whyDescription }}</p>
          <div class="mt-8 grid gap-6 sm:grid-cols-3">
            <div
              v-for="(feat, idx) in whyFeaturesList"
              :key="feat.title"
              class="landing-stagger rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
              :style="{ '--i': idx }"
            >
              <component :is="featureIcons[idx] || Leaf" class="mb-4 size-8 text-orange-400" />
              <h3 class="mb-2 font-semibold">{{ feat.title }}</h3>
              <p class="text-sm text-zinc-400">{{ feat.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <SarabCategorySection
        v-if="products.length > 0"
        :products="products"
        :accent-color="primaryColor"
        :bg-color="categoryBgColor"
        :bg-image="carouselBgImage"
      />

      <SarabOfferSection
        v-if="servicesEnabled"
        :items="servicesData ?? []"
        :accent-color="primaryColor"
        :title="servicesTitle"
        :subtitle="servicesSubtitle"
        :bg-color="servicesBgColor"
        :bg-image="servicesBgImage"
        :book-bg-color="bookBgColor"
        :book-bg-image="bookBgImage"
        :primary-color="primaryColor"
      />

      <SarabConfigurableSections v-bind="props" />

      <section class="landing-fade-up px-6 py-20" :style="{ background: `linear-gradient(135deg, ${primaryColor} 0%, color-mix(in srgb, ${primaryColor} 60%, #000) 100%)` }">
        <div class="mx-auto max-w-3xl text-center">
          <h2 class="mb-4 text-3xl font-bold">{{ t('config.landingSarabCta') }}</h2>
          <p class="mb-8 text-lg text-orange-100">{{ t('config.landingSarabCtaDesc') }}</p>
          <RouterLink to="/order">
            <Button size="lg" class="h-12 rounded-full bg-white px-8 font-semibold text-zinc-900 hover:bg-orange-50">
              {{ t('config.landingSarabOrderNow') }}
              <ArrowRight class="ml-2 size-5" />
            </Button>
          </RouterLink>
        </div>
      </section>

      <section class="landing-fade-up border-t border-zinc-800 bg-zinc-900 px-6 py-10">
        <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-zinc-400">
          <div class="flex items-center gap-2">
            <MapPin class="size-4 text-orange-400" />
            <span>{{ shopAddress || contactAddress || '—' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Phone class="size-4 text-orange-400" />
            <span>{{ shopPhone || contactPhone || '—' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Clock class="size-4 text-orange-400" />
            <span>{{ t('config.landingDefaultHours') }}</span>
          </div>
        </div>
      </section>
    </div>
  </ApplicationLayout>
</template>
