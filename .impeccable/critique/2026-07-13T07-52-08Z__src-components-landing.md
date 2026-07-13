---
target: src/components/landing/
total_score: 28
p0_count: 0
p1_count: 2
timestamp: 2026-07-13T07-52-08Z
slug: src-components-landing
---
# Re-Critique: Landing Page Templates & Components (Post-Fix)

## Design Health Score: 28/40 — Good

| # | Heuristic | Score | Change | Key Issue |
|---|-----------|-------|--------|-----------|
| 1 | Visibility of System Status | 3 | +1 | GSAP no reduced-motion check; Leaflet map no error boundary |
| 2 | Match System/Real World | 3 | 0 | Generic stats (850+, 15+) in 4 templates still fake |
| 3 | User Control and Freedom | 3 | +1 | SpiceHavenNav now sticky; Leaflet silently fails |
| 4 | Consistency and Standards | 2 | +1 | 7 nav components, 3 heading components — no shared vocabulary |
| 5 | Error Prevention | 3 | 0 | Leaflet L.map() crashes if container ref null |
| 6 | Recognition Rather Than Recall | 3 | 0 | tracking-widest uppercase in 7 shared components |
| 7 | Flexibility and Efficiency | 3 | +2 | Component duplication makes maintenance harder |
| 8 | Aesthetic and Minimalist Design | 2 | 0 | Ghost cards in shared components; tracked eyebrows in shared components |
| 9 | Error Recovery | 3 | +1 | Silent failures on map, no visible error state |
| 10 | Help and Documentation | 3 | +1 | Standard, no change |
| **Total** | | **28/40** | **+7** | **Good (address weak areas)** |

## What Improved

1. **Extreme tracked eyebrows eliminated** — `tracking-[0.2em]/[0.15em]/[0.25em] uppercase` zero matches across all templates.
2. **FugaPage glassmorphism gone** — `bg-white/5 backdrop-blur-sm` replaced with `bg-[#1e293b]` solid on all cards.
3. **DefaultPage ghost-cards removed** — `rounded-2xl border hover:shadow-lg` → `rounded-lg border` with no shadow.
4. **SpiceHavenNav sticky** — `absolute` → `fixed` with `bg-stone-950/80 backdrop-blur-md`.
5. **Staff button removed** — `show-staff-button` gone from all 6 landing templates.
6. **Bounce easing fixed** — `animate-bounce` → `animate-pulse`.

## Detector: 4 → 3 findings

| Finding | Status |
|---------|--------|
| bounce-easing (SpiceHavenPage) | **FIXED** |
| overused-font (YummyPage) | Carryover (Open Sans) |
| gray-on-color (YummyPage) | Carryover (borderline FP) |
| gray-on-color (SarabPage) | Carryover (borderline FP) |

Bounce-easing eliminated. Three carryovers remain.

## Remaining Issues

### P1: Tracked eyebrows in 7 shared components (milder variant)
`tracking-widest uppercase` still in ContactSection, ServicesSection, TestimonialsSection, ProductCarousel, GallerySection, DefaultMenuSection, SarabPage hero. Same semantic anti-pattern, one notch milder.

### P2: Ghost-card in 5 shared components
`rounded-2xl border shadow-sm hover:shadow-lg/md` in ServicesSection, DefaultMenuSection, SarabMenuGrid, ProductCarousel, TestimonialsSection. Fix only targeted DefaultPage template, not the shared component library.

### P3: Generic placeholder stats
`850+`, `15+`, `12 yr` in DefaultPage, YummyPage, ApplePage, SarabPage fallback arrays.

### P4: Component vocabulary fragmentation
7 nav components, 3 heading components doing same job with different names.

## Score Trend

First run: 21/40 (High AI Signal)
Current: 28/40 (Moderate AI Signal)
