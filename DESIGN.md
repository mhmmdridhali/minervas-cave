---
version: alpha
name: Minerva's Cave
description: Developer Tool aesthetic for AI agent mission control — dark OLED, functional, data-dense, calm focus.
colors:
  primary: "#0F172A"
  secondary: "#1B2336"
  tertiary: "#22C55E"
  neutral: "#F8FAFC"
  warning: "#F59E0B"
  danger: "#EF4444"
  info: "#3B82F6"
  muted: "#94A3B8"
  on-primary: "#F8FAFC"
  on-tertiary: "#0F172A"
  on-warning: "#0F172A"
  on-danger: "#F8FAFC"
  on-info: "#F8FAFC"
typography:
  h1:
    fontFamily: "Space Grotesk"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  h2:
    fontFamily: "Space Grotesk"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  h3:
    fontFamily: "Space Grotesk"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  body-md:
    fontFamily: "Inter"
    fontSize: "1rem"
    lineHeight: 1.6
  body-sm:
    fontFamily: "Inter"
    fontSize: "0.875rem"
    lineHeight: 1.5
  label-caps:
    fontFamily: "Space Grotesk"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.08em"
  code:
    fontFamily: "JetBrains Mono"
    fontSize: "0.875rem"
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
elevation:
  level1: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)"
  level2: "0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)"
  level3: "0 8px 24px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.12)"
shapes:
  card-radius: "{rounded.md}"
  button-radius: "{rounded.sm}"
  badge-radius: "{rounded.full}"
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.sm}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.sm}"
    padding: 12px
  button-secondary-hover:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.tertiary}"
  card:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: 24px
  input:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.sm}"
    padding: 12px
  badge-success:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.tertiary}"
    rounded: "{rounded.full}"
    padding: 4px
    typography: "{typography.label-caps}"
  badge-warning:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.warning}"
    rounded: "{rounded.full}"
    padding: 4px
    typography: "{typography.label-caps}"
  badge-danger:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
    padding: 4px
    typography: "{typography.label-caps}"
  badge-info:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.info}"
    rounded: "{rounded.full}"
    padding: 4px
    typography: "{typography.label-caps}"
---

## Overview

Minerva's Cave is the mission control dashboard for a team of AI agents. It's a **Developer Tool** — dark OLED (`#0F172A`), data-dense, calm, functional. No marketing fluff, no gradients, no glass. Every pixel earns its keep. The aesthetic is "command line made visual" — monospace for data, clean sans for reading, green for go, red for stop, amber for wait.

## Colors

- **Primary (`#0F172A`):** Deep slate-950, the "black" of the system. Page background, deepest surfaces.
- **Secondary (`#1B2336`):** Slate-800, cards, panels, elevated surfaces.
- **Tertiary/Accent (`#22C55E`):** Emerald-500. The *only* action driver — primary buttons, success states, active indicators. Used sparingly to preserve signal.
- **Warning (`#F59E0B`):** Amber-500. Pending, queued, needs attention.
- **Danger (`#EF4444`):** Red-500. Errors, destructive actions, critical failures.
- **Info (`#3B82F6`):** Blue-500. Secondary actions, links, neutral highlights.
- **Muted (`#94A3B8`):** Slate-400. Secondary text, disabled states, borders. **Meets 4.5:1 on primary.**
- **Neutral/On-primary (`#F8FAFC`):** Slate-50. Primary body text, headings.

No pure `#000` / `#FFF`. All colours are tokens — zero hard-coded hex in components.

## Typography

- **Display/Headings:** Space Grotesk — technical character, geometric, readable at small sizes, distinctive without being loud. Weight 700/600 carries hierarchy.
- **Body/UI:** Inter — neutral, highly legible, large x-height, works at 14px+.
- **Code/Data/Mono:** JetBrains Mono — ligatures off, tabular nums, the only monospace.

Max 3 families. Loaded via Google Fonts `<link preload>` with `font-display: swap`.

## Layout & Spacing

4px baseline grid (`xs=4, sm=8, md=16, lg=24, xl=32, xxl=48`). Consistent rhythm.
- Intra-component: `sm` (8px) / `md` (16px)
- Inter-component: `lg` (24px) / `xl` (32px)
- Section breaks: `xxl` (48px)
- Body measure: 65-75ch via `max-width: 70ch` on prose containers.

## Elevation & Depth

Soft shadows only — offset + blur. No zero-offset coloured halos. Three levels:
- `level1`: subtle card rest
- `level2`: hover/focus elevation
- `level3`: modals, dropdowns, overlays

## Shapes

- Cards: `md` (8px)
- Buttons/Inputs: `sm` (4px)
- Badges/Avatars: `full` (pill)
- No hard `4px 4px 0` neobrutalist offsets.

## Components

- **button-primary**: Only ONE per screen. Emerald fill, dark text. Hover → primary bg.
- **button-secondary**: Outline, slate surface. Hover → muted fill.
- **card**: Slate-800 surface, level1 shadow. Hover → level2.
- **input**: Dark bg, muted border. Focus → emerald ring + glow (accessible).
- **badge**: Semantic colours with 15% opacity bg, full text colour. Label-caps typography.

## Do's and Don'ts

- **Do** use token references (`{colors.tertiary}`) — single source of truth.
- **Do** use `label-caps` (Space Grotesk, 0.75rem, tracking 0.08em) for badges, tabs, section labels.
- **Don't** introduce colours outside the palette — extend the palette first.
- **Don't** nest component variants (`button-primary-hover` is sibling, not child).
- **Don't** use kicker/eyebrow labels above headings — heading weight carries it.
- **Don't** use emoji/unicode as icons — drawn SVG only, consistent stroke.
- **Don't** use gradient text — emphasis via weight/size.
- **Don't** use glass/blur decoratively — only for modal backdrop.
- **Don't** use coloured borders >1px — `1px solid var(--border)` max.
- **Don't** use sparklines/progress rings as content placeholders — honest empty states.
- **Don't** use monospace for "technical look" on headings/body — code/data only.

## Browser Defaults (Craft Floor)

All themed from palette tokens:
- `::selection` — emerald bg, dark text
- `scrollbar` — slate track, muted thumb, emerald hover
- `:focus-visible` — 2px emerald ring, 2px offset
- `text-underline-offset: 2px`
- `font-variant-numeric: tabular-nums` on mono
- `prefers-reduced-motion` respected — all transitions disabled