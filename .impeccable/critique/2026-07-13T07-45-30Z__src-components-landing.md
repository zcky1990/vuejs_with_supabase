---
target: src/components/landing/
total_score: 21
p0_count: 2
p1_count: 3
timestamp: 2026-07-13T07-45-30Z
slug: src-components-landing
---
# Critique: Landing Page Templates & Components

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | No scroll-position feedback beyond tiny progress bar; no loading states for Leaflet map/images |
| 2 | Match System/Real World | 3/4 | Restaurant/warung metaphors correct; "Create Transaction" CTA uses internal product jargon |
| 3 | User Control and Freedom | 2/4 | SpiceHaven nav absolute (disappears on scroll); no sticky CTA; no back-to-top |
| 4 | Consistency and Standards | 1/4 | 7 nav implementations; shared components ignored by 5/6 templates; inconsistent button radii |
| 5 | Error Prevention | 3/4 | WhatsApp links valid; map fallbacks; image fallbacks adequate |
| 6 | Recognition Rather Than Recall | 3/4 | Standard restaurant sections (menu, contact, gallery) easy to navigate |
| 7 | Flexibility and Efficiency | 1/4 | No persistent cart; no quick-order shortcut; every flow requires hero nav |
| 8 | Aesthetic and Minimalist Design | 2/4 | Over-designed: ghost-cards, glassmorphism, 16px radii conflict with "practical and confident" brand |
| 9 | Error Recovery | 2/4 | No undo/back within landing flows; map init can fail silently |
| 10 | Help and Documentation | 2/4 | No contextual help; no tooltips; no guidance for first-time visitors |
| **Total** | | **21/40** | **Acceptable (significant improvements needed)** |

## Anti-Patterns Verdict: HIGH AI SIGNAL

**LLM assessment**: These templates exhibit strong AI-generation tells. Three decisive patterns:

1. **Cloned skeleton with palette swaps.** Every template follows identical section order: hero > about > why > features > stats > menu > testimonials > services > gallery > contact > footer. Only visual coatings change.

2. **Tiny uppercase tracked eyebrows everywhere.** `text-xs font-semibold tracking-[0.2em] uppercase` on every section label in all 6 templates. Default lines 146, 196, 230; SpiceHaven lines 82, 111, 184, 257, 288; Apple lines 80, 131, 162, 197, 250; Fuga lines 82, 134, 166, 216, 271, 303, 350, 378. Single strongest AI tell.

3. **Fragmented component vocabulary.** 7 nav components (LandingNav + 6 template-specific navs). 3 section-heading components. Yummy, SpiceHaven, Sarab each duplicate shared components (ContactSection, GallerySection, ServicesSection, TestimonialsSection) instead of using them.

**Detector scan**: 4 findings across 3 files — `animate-bounce` in SpiceHavenPage (bounce easing), `Open Sans` in YummyPage (overused font), gray-on-color in YummyPage and SarabPage (borderline false positives — both are dark text on very light tinted backgrounds, likely sufficient contrast). The detector caught minor issues but missed the major structural problems (ghost-cards, eyebrows, glassmorphism, component fragmentation). This is expected for a pattern-based detector vs. a structural design review.

**Banned patterns found:**
- Ghost-card pattern (border + hover:shadow-lg): Default features section, stats, feature cards
- Glassmorphism as default: FugaPage — `bg-white/5 backdrop-blur-sm` on every card
- Hero-metric template: All 6 templates follow identical skeleton
- Tiny uppercase tracked eyebrows: Pervasive across all templates
- Identical card grids: 3-col feature grids in Default, Apple, Fuga, Sarab, Yummy, SpiceHaven
- Excessive border-radius: `rounded-2xl` on cards in Default, Apple, Sarab, ServicesSection

## Overall Impression

The landing template system is architecturally ambitious (6 themed templates, shared components, isolated CSS theming) but suffers from **quantity over quality**. The shared component layer exists but is bypassed by most templates, creating fragmentation. The strongest AI tells (cloned structure, ubiquitous eyebrows, ghost-cards) undermine the "Clear, Trustworthy, Efficient" brand personality. Templates feel like theme-skin exercises rather than purpose-built landing pages for warung owners.

**Biggest opportunity**: Reduce template count, consolidate shared components, eliminate the banned patterns, and make the landing page system serve real warung content rather than demonstrating template variety.

## What's Working

1. **CSS variable theme isolation** (`landing-themes.css`): The light/dark theming with shadcn token restoration is architecturally clean and production-grade.

2. **Scroll progress indicator**: Lightweight, effective system status feedback. One of few elements that communicates state.

3. **Empty-state fallbacks**: Every image slot handles zero-data with appropriate icons + muted styling. Good defensive design.

## Priority Issues

### [P0] Inconsistent Component Vocabulary — 7 Nav Components, 3 Heading Components
**Why**: 7 nav implementations (LandingNav + 6 template-specific navs). Shared components only used by Default template. Maintenance burden compounds; fixing a bug requires touching parallel code in 5+ files.
**Fix**: Force all templates through LandingNav with theme prop. Create single `SectionHeading` with theme prop. Deprecate template-specific navs and heading components.
**Suggested command**: `$impeccable extract src/components/landing/`

### [P0] Ghost-Card Pattern in Default Template
**Why**: `rounded-2xl border p-6 hover:shadow-lg` on feature cards, stats, and features container — exact ghost-card banned pattern. Over-designed for a practical brand.
**Fix**: Remove hover shadows. Reduce radius from rounded-2xl to rounded-lg. Use background tint or border color change instead.
**Suggested command**: `$impeccable polish src/components/landing/templates/LandingDefaultPage.vue`

### [P1] Glassmorphism as Default in FugaPage
**Why**: `bg-white/5 backdrop-blur-sm` on every card — features, stats, menu, testimonials, services, gallery, contact. Reduces readability, adds GPU cost, communicates trend-following not elegance.
**Fix**: Replace with solid `bg-[#1e293b]` on card containers. Keep backdrop-blur only on nav overlay.
**Suggested command**: `$impeccable quieter src/components/landing/templates/LandingFugaPage.vue`

### [P1] Tiny Uppercase Tracked Eyebrows Everywhere
**Why**: `text-xs tracking-[0.2em] uppercase` on every section label in all templates. Hard to read at 12px with wide tracking. Number one AI tell. Inverted visual hierarchy (eyebrow harder to parse than heading below it).
**Fix**: Replace with `text-sm font-semibold text-[var(--landing-muted)]` — no tracking, no uppercase, readable weight.
**Suggested command**: `$impeccable typeset src/components/landing/`

### [P1] SpiceHaven Nav Disappears on Scroll
**Why**: SpiceHavenNav uses `absolute inset-x-0 top-0` — scrolls away with hero. Users lose navigation access entirely until scrolling back to top.
**Fix**: Change to `fixed inset-x-0 top-0 z-40 bg-stone-950/80 backdrop-blur-md`.
**Suggested command**: `$impeccable adapt src/components/landing/spicehaven/SpiceHavenNav.vue`

### [P1] Display Font (Amatic SC) in Yummy Nav + Headings
**Why**: Amatic SC cursive applied to nav brand link and section headings via `.yummy-font-display`. Reduces scanability; conflicts with "Clear, Trustworthy" brand.
**Fix**: Restrict Amatic SC to hero h1 only. Use Open Sans for nav, section headings, and body.
**Suggested command**: `$impeccable typeset src/components/landing/yummy/`

### [P2] Identical Generic Stats Values Across Templates
**Why**: "850+" and "15+" appear in Default, Sarab, Apple templates. A warung owner seeing fake placeholder numbers on their own page immediately distrusts the software.
**Fix**: Default to empty array when no stats provided. Remove hardcoded placeholder values.
**Suggested command**: `$impeccable polish src/components/landing/`

### [P2] Landing Page Leaks Internal POS Layout
**Why**: Landing templates wrapped in `ApplicationLayout` with `show-staff-button`. A "Staff" button visible on the public landing page exposes internal controls to customers.
**Fix**: Use a dedicated landing layout or strip staff-related chrome when rendering public-facing pages.
**Suggested command**: `$impeccable harden src/pages/HomePages.vue`

## Cognitive Load Assessment

| Item | Status | Detail |
|------|--------|--------|
| Single focus | PASS | 1-2 CTAs per hero |
| Chunking | PASS | Clear section delineation |
| Grouping | PASS | Grid layout groups related items |
| Visual hierarchy | FAIL | Eyebrow labels (12px) harder to parse than heading below them |
| One thing at a time | PASS | Stagger animations pace reveal |
| Minimal choices (≤4) | FAIL | Nav links = 5 in Sarab, Yummy, Apple |
| Working memory | PASS | No complex step sequences |
| Progressive disclosure | PASS | Linear scroll, well-paced |

**Score**: 2 failures = **MODERATE** cognitive load. Not critical but nav link count exceeds recommended max of 4.

## Persona Red Flags

### Jordan (First-Time Visitor)
- SpiceHaven nav disappears on scroll — Jordan cannot find "Order" without scrolling back to top
- Yummy's Amatic SC cursive on nav — hard to decode brand name
- "Create Transaction" CTA — Jordan expects "Order" or "Book a Table", not internal POS jargon
- Ghost-card hover shadows create visual noise while reading

### Riley (Stress Tester)
- Fuga glassmorphism on every card — GPU thrashing on older devices; Safari compositor cost
- GSAP animations (`useLandingGsap`) — no `prefers-reduced-motion` check
- Leaflet map — no error boundary; silent grey box on tile load failure
- Image fallbacks — `v-if="heroImageUrl"` silently hides image block on broken URL

### Casey (Mobile User)
- Nav links hidden behind `hidden md:flex` — no section shortcuts on phone without scrolling full page
- `text-xs` nav links (12px) below recommended 14px minimum for touch targets
- Gallery hover effects (`group-hover:scale-110`) — useless on mobile, wastes initial paint
- No sticky order button — mobile users must scroll past 10 sections to find contact/order

### Ibu Ani (Project-Specific: Warung Owner)
- Sees "850+ customers" on her own page — knows it's fake, distrusts software immediately
- Sees "Create Transaction" — wanted "View Menu", feels pushed to order
- Sees "Staff" button on public page — internal controls leak to customers, confusing
- Empty image slots with generic icons — looks like a template demo, not her business

### Pak Budi (Project-Specific: Chain Owner)
- No multi-store awareness in template system — must duplicate config per location
- No conversion tracking or UTM passthrough — cannot measure landing-to-order conversion
- Hardcoded colors in SpiceHaven (amber-400, amber-500) — cannot customize without editing template code

## Minor Observations

1. LandingNav has `spicehaven` and `yummy` variants (lines 18-23) but both templates bypass it with own navs — dead code.
2. ServicesSection uses hardcoded `text-slate-900` and `text-slate-500` instead of CSS variables — cannot adapt to dark themes.
3. `landing-stagger` applied with `--i: idx` but no CSS rule defining stagger delay — all animations fire simultaneously.
4. Gallery `alt` text uses `` `Gallery ${idx + 1}` `` — meaningless for accessibility.
5. `carouselMaxItems` vs product count mismatch — if products.length < 3, grid shows incomplete row.
6. ContactSection map init has no error boundary — silent failure on tile load.
7. Default template "Why Choose" uses `whyTitle` for both eyebrow label AND headline — text duplication.
8. SpiceHaven uses `animate-bounce` for scroll-down arrow — bounce easing feels dated per detector finding.

## Questions to Consider

1. **Template structure**: The 10-section skeleton (hero > about > why > features > stats > menu > testimonials > services > gallery > contact > footer) is identical across all 6 templates. A warung owner likely needs a simpler page: hero, menu-as-ordering-entry, hours, location. Is the 10-section template overkill for this use case?

2. **Layout leakage**: Every landing template is wrapped in `ApplicationLayout` with `show-staff-button`, exposing a "Staff" button on the public landing page. Is this deliberate (landing only seen by logged-in staff?) or a bug where public/internal surfaces share a layout incorrectly?

3. **Refactor scope**: The two strongest AI tells (ghost-card pattern, uppercase tracked eyebrows) plus the component fragmentation (7 navs, 3 heading components) point to a meaningful refactor. Should we target the banned patterns specifically, or consolidate the entire component system?
