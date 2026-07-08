import type { LandingTemplate } from '@/types/database'

export type LandingColorMode = 'light' | 'dark'

export const LANDING_TEMPLATE_COLOR_MODE: Record<LandingTemplate, LandingColorMode> = {
  default: 'light',
  yummy: 'light',
  sarab: 'dark',
  spicehaven: 'dark',
  apple: 'light',
}

export const LANDING_TEMPLATE_BASE_BG: Record<LandingTemplate, string> = {
  default: '#ffffff',
  yummy: '#f9f9f9',
  sarab: '#09090b',
  spicehaven: '#0c0a09',
  apple: '#ffffff',
}

export function getLandingColorMode(template: LandingTemplate): LandingColorMode {
  return LANDING_TEMPLATE_COLOR_MODE[template] ?? 'light'
}

export function getLandingThemeAttrs(template: LandingTemplate) {
  const mode = getLandingColorMode(template)
  return {
    class: `landing-theme landing-theme-${mode}`,
    style: { backgroundColor: LANDING_TEMPLATE_BASE_BG[template] },
  }
}
