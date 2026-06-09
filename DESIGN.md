---
name: "If I Bought Then"
description: "A playful black-canvas stock regret picker for shareable what-if results."
colors:
  bg: "oklch(0.055 0 0)"
  surface: "oklch(0.125 0.012 294)"
  surface-muted: "oklch(0.17 0.016 294)"
  surface-raised: "oklch(0.205 0.018 294)"
  ink: "oklch(0.94 0.006 294)"
  muted: "oklch(0.74 0.018 294)"
  subtle: "oklch(0.58 0.02 294)"
  primary: "oklch(0.88 0.16 132)"
  primary-foreground: "oklch(0.08 0.018 132)"
  accent: "oklch(0.62 0.18 294)"
  accent-foreground: "oklch(1 0 0)"
  tease: "oklch(0.69 0.19 28)"
  tease-foreground: "oklch(1 0 0)"
  gain: "oklch(0.72 0.12 252)"
  gain-foreground: "oklch(0.055 0 0)"
  success: "oklch(0.72 0.15 150)"
  loss: "oklch(0.69 0.19 28)"
  loss-foreground: "oklch(1 0 0)"
  warning: "oklch(0.82 0.14 78)"
  disabled: "oklch(0.19 0.012 294)"
  disabled-foreground: "oklch(0.48 0.018 294)"
  overlay: "oklch(0.24 0.07 294 / 0.62)"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 820
    lineHeight: 1.02
    letterSpacing: "0"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 760
    lineHeight: 1.08
    letterSpacing: "0"
  title:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 720
    lineHeight: 1.18
    letterSpacing: "0"
  body:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 450
    lineHeight: 1.55
    letterSpacing: "0"
  label:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 680
    lineHeight: 1.28
    letterSpacing: "0"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
  touch: "44px"
  page-x: "24px"
  page-y: "48px"
  container-page: "55rem"
  container-form: "31.25rem"
  container-result: "20rem"
---

# Design System: If I Bought Then

## 1. Overview

**Creative North Star: "Midnight Group Chat Receipt"**

This interface starts on black. It is not a light UI with a dark-mode variant, and it is not a trading terminal cosplay. The black canvas should feel like a screenshot-ready social object: a missed-stock receipt floating in a group chat, with one sharp joke and one number that lands immediately.

Controls stay familiar because this is still a product surface. The personality comes from high-contrast sticker color, compact Korean copy, and the final result card. The screen should feel playful at night, not serious like an investment tool.

**Key Characteristics:**

- Single black-canvas theme from the first screen.
- Charcoal picker surfaces with state handled by tonal steps and opacity modifiers.
- Named layout width tokens for page, form, and result surfaces. Do not use generic max-width defaults for core layout.
- Lime primary actions for instant social energy.
- Grape accent used as brand flavor, not as a full purple fintech theme.
- Result cards designed to read as a shareable screenshot.
- Semantic stock colors used sparingly and never as the only meaning carrier.

## 2. Colors

The palette is a black product system with sticker-like contrast: near-black canvas, charcoal surfaces, lime action, grape brand flavor, and small semantic flashes for gain or loss.

### Primary

- **Lime Punch** (`primary`, `primary-foreground`): The main action family for selected state, primary buttons, share prompts, and the obvious next step. It uses dark text, not white text.

### Secondary

- **Grape Flash** (`accent`, `accent-foreground`): Brand flavor for secondary actions, active outlines, focus support, and occasional result emphasis. It must not flood the screen.
- **Tomato Tease** (`tease`, `tease-foreground`): A sparing filled accent for punchline moments such as “이걸 놓쳤네”. Use white text only.

### Tertiary

- **Gain Blue** (`gain`, `gain-foreground`): Positive result indicators in the share card. Pair with the explicit “수익” label.
- **Loss Red** (`loss`, `loss-foreground`): Negative result indicators in the share card. Pair with the explicit “손실” label.
- **Gain Green** (`success`): General success and confirmation states outside the stock result color system.
- **Caution Yellow** (`warning`): Data caveats, unavailable dates, market holidays, or estimate labels.

### Neutral

- **Black Canvas** (`bg`): The permanent page background. This is the default theme, not a toggle state.
- **Charcoal Slip** (`surface`): The quiet base for picker panels and page bands.
- **Pressed Charcoal** (`surface-muted`): Input rows, inactive chips, and dense control surfaces.
- **Raised Charcoal Receipt** (`surface-raised`): Result cards and shareable summary surfaces.
- **Soft Ink** (`ink`): Primary text. Use for all body copy and labels that must be read.
- **Dim Ink** (`muted`): Secondary text. It remains bright enough for UI labels.
- **Ghost Ink** (`subtle`): Placeholder text and low-priority hints. Never use below body contrast requirements.
- **Disabled Night** (`disabled`, `disabled-foreground`): Disabled control background and text. Disabled controls remain visible but clearly unavailable.
- **Violet Veil** (`overlay`): Modal and popover backdrop over the black canvas. It is a tinted veil, not a black dimmer, because black-on-black does not create enough separation.

### Named Rules

**The Black-First Rule.** Do not describe this as dark mode. The product identity begins with a black canvas.

**The No-HTS Rule.** Red and blue never dominate the screen. They can mark gain and loss, but the screen must not read as a trading terminal.

**The Sticker Rule.** Lime is for action and jokes. Grape is for brand flavor. Neither color becomes a decorative gradient.

**The State Modifier Rule.** Do not duplicate every color into hover and active tokens. Use opacity modifiers for filled colors (`hover:bg-primary/90`, `active:bg-primary/80`) and move neutral controls through existing surface levels (`bg-surface-muted`, `hover:bg-surface`, `active:bg-surface-raised`).

**The Named Layout Rule.** Core layout widths are named tokens: `container-page`, `container-form`, and `container-result`. Generic widths such as `max-w-lg` or `max-w-4xl` are allowed only for one-off local layout, not for the main product frame.

## 3. Typography

**Display Font:** Pretendard Variable with system sans fallback  
**Body Font:** Pretendard Variable with system sans fallback  
**Label/Mono Font:** No separate mono family by default

**Character:** Korean UI needs a single confident sans family. Weight contrast carries the hierarchy, while letter spacing stays at `0` to avoid cramped Korean labels.

### Hierarchy

- **Display** (820, `2.75rem`, `1.02`): The final result punchline and share-card headline only.
- **Headline** (760, `2rem`, `1.08`): Screen titles and major result summaries.
- **Title** (720, `1.25rem`, `1.18`): Picker group titles, modal titles, and result subsections.
- **Body** (450, `1rem`, `1.55`): Explanatory copy, helper text, and caveats. Cap long prose at 65ch.
- **Label** (680, `0.875rem`, `1.28`): Field labels, chips, buttons, calendar day metadata, and badges.

### Named Rules

**The Punchline Type Rule.** Display type is reserved for the result joke. Inputs and labels stay compact and functional.

## 4. Surface Layering

The system separates depth only through surface tone, spacing, and overlay. On black, the surface steps must be strong enough to read without strokes, keylines, or effect-based separation.

### Surface Vocabulary

- **Canvas** (`bg`): Permanent page base.
- **Surface** (`surface`): Modal headers, footers, and calm secondary bands.
- **Muted Surface** (`surface-muted`): Input rows, inactive chips, and dense control rows.
- **Raised Surface** (`surface-raised`): Main panels, popovers, and result cards.

### Named Rules

**The Tone-Only Rule.** Static panels, floating panels, and result cards use surface steps and spacing for separation.

## 5. Components

### Buttons

- **Shape:** Firm rectangle with softened corners (`8px`). Never pill by default.
- **Primary:** Lime fill, dark text, `44px` minimum height, `12px 18px` padding.
- **Hover / Focus:** Slightly deeper lime on hover. Focus uses a visible `2px` grape ring with `2px` offset.
- **Accent:** Grape fill with white text for secondary brand moments and occasional result emphasis.

### Chips

- **Style:** Pill chips are allowed for quick quantities, preset dates, and “최근 본 종목”.
- **State:** Unselected chips use pressed charcoal and dim ink. Selected chips use lime fill and dark text. Hover moves one tonal step.

### Cards / Containers

- **Corner Style:** Result cards use `16px`. Input groups use `12px`. Do not exceed `16px` for cards.
- **Background:** Input areas use pressed charcoal. Share cards use raised charcoal receipt.
- **Layer Strategy:** Use surface tone changes for structure. Never use a colored side stripe.
- **Internal Padding:** Mobile cards start at `24px`; compact input rows use `14px 16px`.

### Inputs / Fields

- **Style:** Large row fields with clear labels, pressed charcoal background, and `12px` radius.
- **Focus:** Grape focus halo plus lime outer ring. Placeholder text must meet contrast requirements.
- **Error / Disabled:** Error text uses tomato tease with an icon or label. Disabled controls stay readable and should not disappear into black.

### Navigation

- **Style:** The primary flow should not need a heavy nav. Use a compact top area with brand text and optional share/history action.
- **Mobile Treatment:** Keep the picker and primary action reachable without horizontal scrolling.

### Share Result Card

- **Style:** A portrait-oriented charcoal receipt with one headline, one major number, one short tease line, and one share action.
- **Behavior:** The card should stand alone in a screenshot. It should not require surrounding page context to understand the joke.

## 6. Do's and Don'ts

### Do:

- **Do** treat black as the default product identity, not as a theme variant.
- **Do** open directly on stock and date selection. The user came to try a scenario, not read a pitch.
- **Do** use lime for primary action states and shareable joke moments.
- **Do** keep result summaries readable in a screenshot, with one major number and one sentence of context.
- **Do** pair gain/loss colors with labels, arrows, icons, or explicit text.
- **Do** keep every tap target at least `44px` high.

### Don't:

- **Don't** make the UI look like a 증권사 HTS, trading terminal, real-time market dashboard, or 전문 투자 리포트.
- **Don't** make the black canvas feel like a developer terminal, cyberpunk dashboard, or crypto exchange.
- **Don't** lead with dense candlestick charts, order-book layouts, ticker walls, or financial table chrome.
- **Don't** use red and blue as the dominant identity palette.
- **Don't** use gradient text, glassmorphism, colored side stripes, oversized rounded cards, or decorative chart noise.
- **Don't** imply investment advice. The product is a playful what-if result, not a recommendation tool.
