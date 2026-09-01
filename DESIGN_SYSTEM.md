# Turf — "Floodlight" Design System

A cross-platform (iOS / Android / web) UI system built on **NativeWind v4 + Tailwind**,
**shadcn-style primitives**, and a **Moti/Reanimated (native) + Framer Motion/GSAP (web)**
motion layer.

---

## 1. Foundation

| Concern | Where |
| --- | --- |
| Colour / radius / type tokens | `tailwind.config.js` + `global.css` (CSS vars, light + `.dark`) |
| JS-side raw colours (icons, gradients, charts, nav theme) | `src/lib/tokens.ts` → `useTokens()` / `token()` / `sportColor()` |
| `cn()` class merge helper | `src/lib/utils.ts` |
| Dark mode | driven by `nativewindColorScheme.set()` in `src/app/_layout.tsx`, synced to the user's `theme` preference (`light \| dark \| blue`; `blue` renders on the light token set) |
| Metro / Babel / CSS entry | `metro.config.js` (`withNativeWind`), `babel.config.js` (`jsxImportSource`), `global.css` imported once in `_layout.tsx` |

### Palette roles (use the class, not the hex)

`bg-background` `text-foreground` `bg-card` `bg-card-elevated` `border-border`
`bg-primary text-primary-foreground` (pitch green) · `bg-accent` (amber – money / rewards)
`bg-muted text-muted-foreground` · `text-success` `text-warning` `text-destructive` `text-info`
`bg-primary/15` etc. for tints · `bg-floodlight` for neon glow.

### Type scale — always via `<Text variant="…">`

RN does **not** inherit text styles across `View`s, so every string lives in a `<Text>`.

**Weight rule — bold is reserved for parent (page-level) headings.** Nested text —
card titles, list-item titles, section labels, buttons, badges, chips, tab labels, values —
never goes above semibold, and headings inside cards sit one step smaller than page headings.

| Variant | Weight | Size | Use |
| --- | --- | --- | --- |
| `display` | **extrabold** | 38 | page hero title (auth screens) |
| `title` | **bold** | 24 | page title (`Screen header large`) |
| `heading` | **bold** | 20 | page-level heading |
| `subheading` | medium | 15 | **card titles**, sheet titles, empty-state titles |
| `body` | regular | 15 | body copy |
| `callout` | medium | 13 | emphasised body; nav-bar title (the one bold exception, via `AppHeader`) |
| `subtle` | regular | 13 | secondary copy |
| `caption` | medium | 12 | metadata |
| `overline` | semibold | 10 | section labels (`Section title`) |
| `link` | medium | 13 | inline links / section actions |

When hand-writing classes on a screen: card/list-item headings → `font-medium text-sm`,
emphasised values and control labels → `font-semibold`. Never `font-bold` outside the three
parent-heading variants.

---

## 2. Primitives — `src/components/ui/*` (barrel: `@/components/ui`)

`Text` · `Button` (`primary\|accent\|secondary\|outline\|ghost\|destructive`, `sm\|md\|lg\|icon`, `loading`, `leftIcon/rightIcon`, `block`)
`Card` (+ `CardHeader/Title/Description/Content/Footer`, `variant`, `padded`, `onPress`)
`Input` (`label`, `error`, `hint`, `leftSlot`, `rightSlot`)
`Badge` (tone variants, `dot`) · `Avatar` / `AvatarStack` · `Chip` / `ChipGroup`
`Skeleton` / `SkeletonText` · `Separator` / `LabeledSeparator` · `Switch` · `Progress` / `ProgressRing`
`Sheet` (bottom sheet, Reanimated slide + backdrop) · `Section` (title + optional action) · `EmptyState`

## 3. Layout — `src/components/layout/*`

`Screen` — safe-area shell: `header` (`AppHeaderProps | false`), `scroll`, `padded`, `footer` (sticky CTA bar),
`refreshing`/`onRefresh`, centred `web:max-w-[880px]` column.
`AppHeader` — nav bar or `large` title style, auto back button.
`AuthShell` — floodlit gradient backdrop for the `(auth)` group.

## 4. Motion — `src/components/motion` (native) / `index.web.tsx` (web), same API

`MotionView` (`preset`: `fade \| fade-up \| fade-down \| scale-in \| slide-left \| slide-right`, `delay`, `duration`)
`MotionPressable` (press scale; hover scale on web) · `Stagger` · `AnimatedCounter` · `FloodlightPulse`
`AnimatePresence` (real on web, no-op native) · `useGsapReveal()` (GSAP entrance timeline on web, no-op native)

---

## 5. Converting a screen — the pattern

1. **Keep** all hooks, state, handlers, API/store calls, navigation and route params **verbatim**.
2. **Delete** the `StyleSheet.create({...})` block and the `ThemedText`/`ThemedView`/`GradientContainer`/`useTheme` imports.
3. Wrap the body in `<Screen header={{ title }}>` (or `<AuthShell>` for auth). Use `footer=` for sticky CTA bars.
4. Replace:
   | Old | New |
   | --- | --- |
   | `<ThemedText type="...">` | `<Text variant="...">` |
   | ad-hoc `<Pressable style={btn}>` | `<Button variant=… size=…>` |
   | card `<View style={card}>` | `<Card variant="surface\|elevated">` |
   | `<TextInput style={input}>` | `<Input label= leftSlot=… />` |
   | status pills | `<Badge variant=…>` |
   | filter pills | `<Chip>` / `<ChipGroup>` |
   | section header + "See all" | `<Section title=… action={{label,onPress}}>` |
   | any `font-bold` that isn't the page title | `font-medium text-sm` (headings) / `font-semibold` (values, labels) |
   | manual modal sheet | `<Sheet open= onClose= title=>` |
   | `theme.primary` etc. for an icon `color` | `useTokens().primary` |
   | list entrance animations | wrap rows in `<Stagger>` or `<MotionView preset="fade-up" delay={i*0.05}>` |
5. Icon libraries: `Ionicons` for UI glyphs; `SPORTS_LIST[].icon` are **MaterialIcons** names.
5b. **Third-party components need `cssInterop`** — NativeWind only maps `className` for RN's own
   components; on anything else it is silently ignored. Register it in
   `src/lib/nativewind-interop.ts` (already done for `LinearGradient`) or pass `style` instead.
6. Verify: `npx tsc --noEmit` → `npx expo export --platform web` / `ios` / `android`.

### Reference conversions already done
`(tabs)/_layout.tsx`, `(auth)/{landing,login,signup,forgot-password}.tsx`, `(tabs)/{matches,club}.tsx`,
`admin/{index,dashboard,create-turf}.tsx`, `coach/index.tsx`, `coach-profile/[id].tsx`,
`enroll.tsx`, `booking-confirmation.tsx`, `coach-home.tsx`, `new-match.tsx`,
`components/home/player-dashboard.tsx` (the Player home, rendered from `(tabs)/index.tsx`).

### Remaining screens (inherit the theme via `_layout`, still on old primitives)
`(tabs)/index.tsx` *(Owner / Coach / Organizer branches only — Player is done)*,
`(tabs)/{explore,tournaments,network,coach}.tsx`, `booking.tsx`, `details.tsx`, `profile.tsx`,
`edit-profile.tsx`, `player-profile.tsx`, `settings.tsx`, `wallet.tsx`, `voucher-redeem.tsx`, `scoring.tsx`,
`create-turf.tsx`, `create-class.tsx`, `create-tournament.tsx`, `tournament-details.tsx`,
`team-registration.tsx`, `team-management.tsx`, `fixture-management.tsx`, `owner-offers.tsx`,
`book-coach.tsx`, `coach-students.tsx`, `coach/[id].tsx`, `admin` deep screens.

---

## 6. Notes / caveats

- **Native motion (Moti 0.30 + Reanimated 4.3)** bundles cleanly for iOS & Android here but was not run
  on a device in this environment — smoke-test `MotionPressable` / `Sheet` / `Switch` on a simulator.
- `blur-3xl` and other web-only Tailwind filters are silently ignored on native (glows still render as soft colour).
- The experimental React Compiler lint rules (`react-hooks/immutability|refs|purity|set-state-in-effect`)
  are set to **warn** in `eslint.config.js` — Reanimated shared values and RN `Animated.Value` refs
  legitimately trip them and the codebase is not compiler-clean yet.
