---
name: Apex Velocity
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#44474e'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#495f84'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#001b3d'
  on-primary-container: '#6f84ac'
  inverse-primary: '#b1c7f2'
  secondary: '#765b00'
  on-secondary: '#ffffff'
  secondary-container: '#ffc703'
  on-secondary-container: '#6e5400'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b1c7f2'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#31476b'
  secondary-fixed: '#ffdf94'
  secondary-fixed-dim: '#f5bf00'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#594400'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style
The design system embodies a "Sports OS" aesthetic—a high-productivity environment designed for performance tracking and elite athletic management. The personality is disciplined, authoritative, and premium. It moves away from generic dark modes toward a sophisticated, high-contrast light interface that mirrors professional editorial layouts and technical instrument panels.

The design style is **Corporate Modern with a Minimalist edge**. It prioritizes extreme clarity and information density without sacrificing elegance. By utilizing a "cool-gray" foundation, the UI feels clinical yet premium, allowing vibrant gold accents to guide the user's eye toward critical performance metrics and primary actions.

## Colors
This design system utilizes a "Technical Light" palette. The foundation is built on **White (#FFFFFF)** for primary surfaces and **Slate-50 (#F8FAFC)** for background offsets, creating a crisp, airy environment.

- **Primary (Deep Navy):** Reserved for high-level navigation, primary headers, and critical call-to-actions. It provides the "anchor" for the visual hierarchy.
- **Secondary (Vibrant Gold):** Used sparingly as a "performance indicator." It highlights active states, trophies, record-breaking metrics, and primary buttons in high-energy contexts.
- **Neutrals (Cool Grays):** A tiered system of cool grays handles borders, secondary text, and inactive states to maintain a calm, organized atmosphere.

## Typography
**Hanken Grotesk** is the sole typeface, chosen for its sharp terminals and contemporary Swiss-inspired geometry. It communicates precision. 

- **Display & Headlines:** Use tighter letter spacing and heavier weights (700-800) to create a sense of strength and impact.
- **Labels:** Small caps and increased letter spacing (5%) are used for data categories and metadata to differentiate them from body content.
- **Numbers:** In this "Sports OS" context, tabular lining figures should be used for all data tables and metric visualizations to ensure vertical alignment of digits.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for desktop (12 columns) and a fluid model for mobile. It uses a base-4 increment system to ensure mathematical harmony.

- **Desktop:** 1280px max-width container with 24px gutters. Content is often organized in "Modules" that span 3, 4, or 6 columns.
- **Information Density:** Vertical rhythm is tight (8px-16px) within components to maximize data visibility, while larger "breathing room" (40px-64px) is used between major sections to maintain a premium, uncluttered feel.
- **Sidebars:** A fixed left-hand navigation (280px) provides consistent access to high-level modules, using the Deep Navy background to separate "Control" from "Data."

## Elevation & Depth
Depth is achieved through **Tonal Layering** and **Soft Ambient Shadows**. This design system avoids heavy blacks in shadows, opting instead for semi-transparent Navy tints.

- **Level 0 (Floor):** White (#FFFFFF) primary background.
- **Level 1 (Cards/Containers):** Subtle light-gray fill (#F8FAFC) with a 1px border (#E2E8F0). No shadow.
- **Level 2 (Active/Hover):** White surface with a "Floating" shadow: `0px 4px 20px rgba(0, 27, 61, 0.08)`.
- **Level 3 (Modals/Overlays):** `0px 12px 48px rgba(0, 27, 61, 0.12)`.
- **Glassmorphism:** Use sparingly for navigation blurs (12px blur, 80% opacity white) to maintain context during scrolling.

## Shapes
The shape language is **Soft (0.25rem)**. This subtle rounding maintains a professional, architectural feel—more sophisticated than fully rounded "consumer" apps, but more approachable than sharp-edged "legacy" software.

- **Standard Elements:** 4px (0.25rem) radius for inputs, small buttons, and chips.
- **Large Containers:** 8px (0.5rem) radius for cards and main content areas.
- **Buttons:** Keep consistent at 4px. Avoid pill shapes to maintain the "Sports OS" professional aesthetic.

## Components
- **Buttons:** Primary buttons are Deep Navy with white text. Secondary buttons use a Ghost style with a cool-gray border. The Gold accent is reserved for "Action-Success" states or specialized "Pro" feature triggers.
- **Data Cards:** Cards utilize a 1px Slate-200 border. Headers within cards should use the `label-md` style for a technical, organized look.
- **Status Chips:** Small, low-saturation backgrounds (e.g., light green, light red) with high-saturation text to indicate performance status (e.g., "In Range," "Peak").
- **Inputs:** Minimalist underline or 4-sided light borders. On focus, the border transitions to Deep Navy with a 2px bottom stroke.
- **Data Visualizations:** Charts should use a palette of Navy, Gold, and Slate-400. Grid lines in charts must be extremely subtle (#F1F5F9).