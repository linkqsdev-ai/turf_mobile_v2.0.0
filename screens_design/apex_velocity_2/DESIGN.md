---
name: Apex Velocity
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf1'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fa'
  on-surface: '#111c2c'
  on-surface-variant: '#43474b'
  inverse-surface: '#263142'
  inverse-on-surface: '#ebf1ff'
  outline: '#73787b'
  outline-variant: '#c3c7cb'
  surface-tint: '#50616b'
  primary: '#05151e'
  on-primary: '#ffffff'
  primary-container: '#1a2a33'
  on-primary-container: '#81919c'
  inverse-primary: '#b8c9d5'
  secondary: '#835500'
  on-secondary: '#ffffff'
  secondary-container: '#feae2c'
  on-secondary-container: '#6b4500'
  tertiary: '#14140f'
  on-tertiary: '#ffffff'
  tertiary-container: '#292823'
  on-tertiary-container: '#928f88'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e5f1'
  primary-fixed-dim: '#b8c9d5'
  on-primary-fixed: '#0d1d26'
  on-primary-fixed-variant: '#394953'
  secondary-fixed: '#ffddb4'
  secondary-fixed-dim: '#ffb955'
  on-secondary-fixed: '#291800'
  on-secondary-fixed-variant: '#633f00'
  tertiary-fixed: '#e7e2da'
  tertiary-fixed-dim: '#cac6bf'
  on-tertiary-fixed: '#1d1c17'
  on-tertiary-fixed-variant: '#494741'
  background: '#f9f9ff'
  on-background: '#111c2c'
  surface-variant: '#d8e3fa'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 12px
---

## Brand & Style

This design system is engineered for a "Sports OS" environment—a high-performance, mobile-first interface that balances the urgency of live data with the structured clarity of a productivity suite. The brand personality is **Elite, Energetic, and Disciplined**. It avoids the cluttered tropes of traditional sports betting or news apps in favor of a **Modern Corporate** aesthetic refined by **Minimalist** principles.

The visual narrative relies on high-contrast storytelling: deep, authoritative backgrounds contrasted with vibrant, action-oriented accents. The emotional goal is to make the user feel like a professional athlete or high-stakes manager—focused, informed, and ahead of the clock.

## Colors

The palette is derived from the precision of luxury athletic equipment and high-end editorial design.

*   **Primary (#1A2A33):** A sophisticated charcoal navy used for heavy lifting—headers, primary cards, and high-importance interactive regions. It provides the "OS" feel, grounding the UI in a professional space.
*   **Secondary (#F5A623):** This vibrant gold acts as the "action" color. It is used sparingly for primary buttons, progress indicators (rings/meters), and active states to guide the eye immediately to critical tasks.
*   **Tertiary/Surface (#FDF8F0):** A soft cream off-white that serves as the canvas. This reduces the harsh eye strain of pure white while maintaining high contrast with the primary navy.
*   **Neutrals:** A range of cool grays used for secondary text and borders to maintain a clean, monochromatic structure outside of action points.

## Typography

The system utilizes **Hanken Grotesk** as the primary typeface. Its sharp, contemporary geometry mirrors the precision of sports data while remaining highly legible during rapid scrolling. 

*   **Headlines:** Utilize heavier weights (600-700) with slight negative letter spacing to create a dense, "front-page" impact.
*   **Body:** Optimized for readability with generous line heights to accommodate data-heavy schedules and stats.
*   **Labels:** **Plus Jakarta Sans** is used for secondary metadata and overlines. Its slightly rounder, friendly nature provides a subtle relief to the technical sharpness of the rest of the UI.

## Layout & Spacing

This design system follows a **Fluid Grid** model optimized for handheld performance. The layout is built on a 4px baseline grid to ensure mathematical harmony across all components.

*   **Mobile Framework:** Uses a 4-column grid with 20px outer margins.
*   **Component Density:** High. Elements are packed tightly but separated by distinct tonal shifts or shadows to allow for more data visibility without clutter.
*   **Vertical Rhythm:** Standardized spacing of 24px between major sections (e.g., "Today's Schedule" to "Stats Preview"), and 12px between items within a list or group.

## Elevation & Depth

Hierarchy in this design system is achieved through **Tonal Layering** combined with **Ambient Shadows**. 

*   **Base Layer:** The soft cream background (#FDF8F0) acts as the foundation.
*   **Surface Layer:** Cards and containers use either pure white (#FFFFFF) for light-on-light separation or the primary navy (#1A2A33) for high-impact focus.
*   **Shadow Profile:** Shadows are extremely soft and diffused (Blur: 20px, Opacity: 4-6%) with a slight tint of the primary navy. This creates a "hovering" effect rather than a "stuck-on" look.
*   **Inner Depth:** Used for progress bars and input wells to create a tactile, "etched" appearance that feels structural.

## Shapes

The design system embraces a **Rounded (2xl)** philosophy. This softens the high-performance "tech" feel, making the app feel more accessible and premium.

*   **Standard Components:** Buttons, input fields, and small chips utilize a 0.5rem (8px) radius.
*   **Main Containers:** Large cards and primary section blocks use a more pronounced 1.5rem (24px) radius to create the "OS" look—reminiscent of mobile widgets.
*   **Full Rounding:** Circular treatments are reserved exclusively for progress rings, profile avatars, and icon backgrounds to maintain a strict geometric distinction from structural containers.

## Components

### Buttons
*   **Primary:** Solid gold (#F5A623) with navy text (#1A2A33). High-radius (pill-style) for maximum clickability.
*   **Secondary:** Navy background with gold or white text. Used for secondary actions within dark containers.
*   **Ghost:** Transparent with a thin neutral border, used for tertiary actions like "View More."

### Cards
*   **Schedule Cards:** White or soft cream backgrounds with a subtle shadow. 
*   **Performance Cards:** Navy backgrounds with gold accent progress rings. These should feature high-contrast data points for quick scanning.

### Chips & Tags
*   Small, rounded pills with a 12px height. Use low-opacity tints of the accent colors (e.g., 10% gold background with 100% gold text) for status indicators.

### Inputs
*   Clean, bordered fields with a 1px solid stroke. On focus, the border transitions to gold (#F5A623) with a soft outer glow.

### Progress Indicators
*   Circular rings are the primary visual for "completion" or "live game progress," utilizing the gold (#F5A623) against a navy track.