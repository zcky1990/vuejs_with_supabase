<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, UtensilsCrossed, Clock, Star, MapPin, Phone, ChefHat, Users, Leaf, Check } from '@lucide/vue'
import ApplicationLayout from '@/layouts/ApplicationLayout.vue'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/composables/useI18n'
import { landingSectionStyle } from '@/lib/landing-section-style'
import DefaultNav from '@/components/landing/default/DefaultNav.vue'
import DefaultMenuSection from '@/components/landing/default/DefaultMenuSection.vue'
import DefaultConfigurableSections from '@/components/landing/default/DefaultConfigurableSections.vue'
import type { LandingPageProps } from '@/components/landing/landing-page-props'

const props = defineProps<Omit<LandingPageProps, 'template'>>()

const { t } = useI18n()

const displayTitle = computed(() => props.heroTitle || props.shopName)
const displaySubtitle = computed(() => props.heroSubtitle || t('config.landingDefaultHero'))
const displayTagline = computed(() => props.heroTagline || t('config.landingDefaultBadge'))

const heroStyle = computed(() => {
  if (props.heroBgImage?.trim()) {
    return landingSectionStyle(props.heroBgImage, props.heroBgColor)
  }
  const c = props.primaryColor
  return {
    background: `linear-gradient(135deg, ${c} 0%, color-mix(in srgb, ${c} 70%, #000) 100%)`,
  }
})

const ctaBackground = computed(() => {
  const c = props.primaryColor
  return `linear-gradient(135deg, color-mix(in srgb, ${c} 85%, #000) 0%, color-mix(in srgb, ${c} 60%, #000) 100%)`
})

const aboutImage = computed(() => props.aboutImageUrl || props.heroImageUrl)
const aboutStyle = computed(() => landingSectionStyle(props.aboutBgImage, props.aboutBgColor))
const whyStyle = computed(() => landingSectionStyle(props.whyBgImage, props.whyBgColor))

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
    { value: '12 yr', label: t('config.landingYummyStat4') },
  ]
})

const menuCount = computed(() => props.products.length)
const featureIcons = [ChefHat, Users, Leaf]
</script>

<template>
  <ApplicationLayout>
    <div class="w-full text-[var(--landing-text)]">
      <div class="landing-scroll-progress fixed top-0 right-0 left-0 z-[60] h-0.5 origin-left scale-x-0" :style="{ backgroundColor: primaryColor }" />
      <section
        id="hero"
        class="landing-fade-in relative flex min-h-[85vh] flex-col overflow-hidden"
        :style="heroStyle"
      >
        <DefaultNav :shop-name="shopName" :accent-color="primaryColor" :nav-logo-url="navLogoUrl" />
        <div class="relative z-10 flex flex-1 items-center px-6 py-16">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_60%_50%,rgba(255,255,255,0.06)_0%,transparent_60%)]" />
          <div class="relative mx-auto flex w-full max-w-6xl flex-col-reverse items-center gap-12 lg:flex-row lg:gap-16">
            <div class="landing-hero-choreo landing-fade-up landing-delay-1 flex-1 text-center lg:text-left">
              <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
                <Star class="size-3.5 fill-amber-400 text-amber-400" />
                <span>{{ displayTagline }}</span>
              </div>
              <h1 class="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-7xl">
                {{ displayTitle }}
              </h1>
              <p class="mb-10 max-w-xl text-lg leading-relaxed text-white/70">
                {{ displaySubtitle }}
              </p>
              <div class="flex flex-wrap justify-center gap-4 lg:justify-start">
                <RouterLink to="/order">
                  <Button size="lg" class="h-12 bg-white px-8 text-slate-900 hover:bg-white/90">
                    <UtensilsCrossed class="mr-2 size-5" />
                    {{ t('nav.createTransaction') }}
                  </Button>
                </RouterLink>
                <RouterLink to="/book">
                  <Button variant="outline" size="lg" class="h-12 border-white/30 px-8 text-white hover:bg-white/10 hover:text-white">
                    {{ t('nav.bookings') }}
                    <ArrowRight class="ml-2 size-5" />
                  </Button>
                </RouterLink>
              </div>
            </div>
            <div class="landing-fade-up landing-delay-2 flex-1">
              <div class="relative mx-auto max-w-md lg:max-w-none">
                <div class="absolute -inset-4 rounded-3xl bg-white/10 blur-xl" />
                <img
                  v-if="heroImageUrl"
                  :src="heroImageUrl"
                  :alt="displayTitle"
                  class="relative z-10 w-full rounded-2xl object-cover shadow-2xl"
                />
                <div
                  v-else
                  class="relative z-10 flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-white/10 shadow-2xl"
                >
                  <UtensilsCrossed class="size-20 text-white/30" />
                </div>
              </div>
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
        <div class="mx-auto max-w-6xl">
          <div class="mb-12 text-center">
            <p class="mb-2 text-sm font-semibold" style="color: var(--landing-muted)">
              {{ aboutLabel || t('config.landingDefaultAbout') }}
            </p>
            <h2 class="text-3xl font-bold tracking-tight" style="color: var(--landing-heading)">
              {{ aboutTitle || t('config.landingDefaultAboutTitle') }}
            </h2>
          </div>
          <div class="grid items-center gap-12 lg:grid-cols-2">
            <div class="overflow-hidden rounded-xl">
              <img
                v-if="aboutImage"
                :src="aboutImage"
                :alt="shopName"
                class="h-full min-h-[320px] w-full object-cover"
              />
              <div
                v-else
                class="flex min-h-[320px] items-center justify-center rounded-xl bg-muted/40"
              >
                <UtensilsCrossed class="size-16 text-muted-foreground/40" />
              </div>
            </div>
            <div>
              <p class="mb-6 leading-relaxed" style="color: var(--landing-muted)">
                {{ aboutDescription || t('config.landingDefaultAboutDesc') }}
              </p>
              <ul class="mb-8 space-y-3">
                <li
                  v-for="(bullet, idx) in aboutBulletsList"
                  :key="idx"
                  class="flex gap-3 text-sm"
                  style="color: var(--landing-muted)"
                >
                  <Check class="mt-0.5 size-4 shrink-0" :style="{ color: primaryColor }" />
                  <span>{{ bullet }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="whyEnabled"
        id="why-choose"
        class="landing-fade-up border-b px-6 py-20"
        :style="whyStyle"
      >
        <div class="mx-auto max-w-6xl">
          <div class="mb-12 text-center">
            <p class="mb-2 text-sm font-semibold" style="color: var(--landing-muted)">
              {{ whyLabel || t('config.landingDefaultWhy') }}
            </p>
            <h2 class="text-3xl font-bold tracking-tight" style="color: var(--landing-heading)">
              {{ whyTitle || t('config.landingDefaultWhy') }}
            </h2>
            <p v-if="whyDescription" class="mt-3 max-w-2xl mx-auto" style="color: var(--landing-muted)">
              {{ whyDescription }}
            </p>
          </div>
          <div class="grid gap-6 sm:grid-cols-3">
            <div
              v-for="(feat, idx) in whyFeaturesList"
              :key="feat.title"
              class="landing-stagger rounded-lg border p-6 text-center"
              :style="{ '--i': idx, borderColor: 'var(--landing-border)', backgroundColor: 'var(--landing-surface)' }"
            >
              <component :is="featureIcons[idx % featureIcons.length]" class="mx-auto mb-4 size-8" :style="{ color: primaryColor }" />
              <h3 class="mb-2 font-semibold" style="color: var(--landing-heading)">{{ feat.title }}</h3>
              <p class="text-sm leading-relaxed" style="color: var(--landing-muted)">{{ feat.description }}</p>
            </div>
          </div>
          <div v-if="whyStatsList.length > 0" class="landing-fade-up mt-12 grid gap-6 rounded-lg border px-6 py-10 sm:grid-cols-4" :style="{ borderColor: 'var(--landing-border)', backgroundColor: 'var(--landing-surface)' }">
            <div v-for="stat in whyStatsList" :key="stat.label" class="text-center">
              <p class="landing-counter text-3xl font-bold" :style="{ color: primaryColor }">{{ stat.value }}</p>
              <p class="mt-1 text-sm" style="color: var(--landing-muted)">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="landing-fade-up border-b px-6 py-20" style="background-color: var(--landing-surface)">
        <div class="mx-auto max-w-6xl">
          <div class="mb-12 text-center">
            <p class="mb-2 text-sm font-semibold" style="color: var(--landing-muted)">
              {{ t('config.landingDefaultFeaturesLabel') }}
            </p>
            <h2 class="text-3xl font-bold tracking-tight" style="color: var(--landing-heading)">
              {{ t('config.landingDefaultFeaturesTitle') }}
            </h2>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="(item, idx) in [
                { icon: ChefHat, bg: 'bg-amber-100', color: 'text-amber-600', title: t('config.landingDefaultFeat1Title'), desc: t('config.landingDefaultFeat1Desc') },
                { icon: Leaf, bg: 'bg-emerald-100', color: 'text-emerald-600', title: t('config.landingDefaultFeat2Title'), desc: t('config.landingDefaultFeat2Desc') },
                { icon: Clock, bg: 'bg-sky-100', color: 'text-sky-600', title: t('config.landingDefaultFeat3Title'), desc: t('config.landingDefaultFeat3Desc') },
                { icon: Users, bg: 'bg-violet-100', color: 'text-violet-600', title: t('config.landingDefaultFeat4Title'), desc: t('config.landingDefaultFeat4Desc') },
              ]"
              :key="idx"
              class="landing-stagger group rounded-lg border p-6"
              style="border-color: var(--landing-border); background-color: var(--landing-surface)"
              :style="{ '--i': idx }"
            >
              <div class="mb-4 flex size-12 items-center justify-center rounded-xl" :class="item.bg">
                <component :is="item.icon" class="size-6" :class="item.color" />
              </div>
              <h3 class="mb-2 font-semibold" style="color: var(--landing-heading)">{{ item.title }}</h3>
              <p class="text-sm leading-relaxed" style="color: var(--landing-muted)">{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <DefaultConfigurableSections v-bind="props" />

      <DefaultMenuSection
        v-if="carouselEnabled"
        :products="products"
        :max-items="carouselMaxItems"
        :accent-color="primaryColor"
        :title="carouselTitle"
        :bg-color="carouselBgColor"
        :bg-image="carouselBgImage"
      />

      <section class="landing-fade-up px-6 py-20" :style="{ background: ctaBackground }">
        <div class="mx-auto max-w-3xl text-center">
          <h2 class="mb-4 text-3xl font-bold tracking-tight text-white">{{ t('config.landingDefaultCta') }}</h2>
          <p class="mb-8 text-lg text-white/70">{{ t('config.landingDefaultCtaDesc') }}</p>
          <RouterLink to="/order">
            <Button size="lg" class="h-12 bg-white px-8 text-slate-900 hover:bg-white/90">
              {{ t('nav.createTransaction') }}
              <ArrowRight class="ml-2 size-5" />
            </Button>
          </RouterLink>
        </div>
      </section>

      <section
        id="contact"
        v-if="!contactEnabled"
        class="landing-fade-up border-t px-6 py-10"
        style="border-color: var(--landing-border); background-color: var(--landing-surface-muted)"
      >
        <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm" style="color: var(--landing-muted)">
          <div class="flex items-center gap-2">
            <MapPin class="size-4" />
            <span>{{ contactAddress || shopAddress || '—' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Phone class="size-4" />
            <span>{{ contactPhone || shopPhone || '—' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Clock class="size-4" />
            <span>{{ t('config.landingDefaultHours') }}</span>
          </div>
        </div>
      </section>
    </div>
  </ApplicationLayout>
</template>
