---
name: Lihat.in
description: Existing cyan and zinc dashboard system with scoped notification workspace patterns.
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.141 0.005 285.823)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.141 0.005 285.823)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.141 0.005 285.823)"
  primary: "oklch(0.78 0.09 220)"
  primary-ink: "oklch(0.4 0.08 220)"
  primary-foreground: "oklch(0.15 0.02 220)"
  secondary: "oklch(0.8419 0.0652 218.7)"
  secondary-foreground: "oklch(0.15 0.02 220)"
  muted: "oklch(0.967 0.001 286.375)"
  muted-foreground: "oklch(0.552 0.016 285.938)"
  accent: "oklch(0.967 0.001 286.375)"
  accent-foreground: "oklch(0.21 0.006 285.885)"
  destructive: "oklch(0.577 0.245 27.325)"
  border: "oklch(0.92 0.004 286.32)"
  input: "oklch(0.92 0.004 286.32)"
  ring: "oklch(0.4 0.08 220)"
  background-dark: "oklch(0.141 0.005 285.823)"
  foreground-dark: "oklch(0.985 0 0)"
  card-dark: "oklch(0.21 0.006 285.885)"
  card-foreground-dark: "oklch(0.985 0 0)"
  popover-dark: "oklch(0.21 0.006 285.885)"
  popover-foreground-dark: "oklch(0.985 0 0)"
  primary-dark: "oklch(0.72 0.1 220)"
  primary-ink-dark: "oklch(0.84 0.07 220)"
  primary-foreground-dark: "oklch(0.15 0.02 220)"
  secondary-dark: "oklch(0.8419 0.0652 218.7)"
  secondary-foreground-dark: "oklch(0.15 0.02 220)"
  muted-dark: "oklch(0.274 0.006 286.033)"
  muted-foreground-dark: "oklch(0.705 0.015 286.067)"
  accent-dark: "oklch(0.274 0.006 286.033)"
  accent-foreground-dark: "oklch(0.985 0 0)"
  destructive-dark: "oklch(0.704 0.191 22.216)"
  border-dark: "oklch(1 0 0 / 10%)"
  input-dark: "oklch(1 0 0 / 15%)"
  ring-dark: "oklch(0.72 0.1 220)"
typography:
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, Helvetica, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\", sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: "2.25rem"
    letterSpacing: "-0.025em"
  headline-compact:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, Helvetica, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\", sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, Helvetica, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\", sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
    letterSpacing: "normal"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, Helvetica, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\", sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.5rem"
    letterSpacing: "normal"
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, Helvetica, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\", sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
    letterSpacing: "normal"
  metadata:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, Helvetica, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\", sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
    letterSpacing: "normal"
rounded:
  sm: "calc(0.65rem - 4px)"
  md: "calc(0.65rem - 2px)"
  lg: "0.65rem"
  xl: "calc(0.65rem + 4px)"
  full: "9999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.25rem 0.75rem"
    height: "2.25rem"
  channel-nav:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.label}"
    padding: "0 0.25rem 1rem"
  badge-outline:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.5rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
  announcement-preview:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "1.25rem"
    width: "100%"
---

# Design System: Lihat.in

## Overview

The existing dashboard identity is the authority: cool cyan actions, zinc neutral surfaces, English copy, and a practical sans serif hierarchy. This document records the implemented system from `app/globals.css`, `app/layout.tsx`, shared UI primitives, and completed notification and account-session surfaces. It does not replace the visual identity of other dashboard routes.

The notification extension inherits that identity and uses a shared channel navigation, message list, and detail sheet. Its specific composition belongs to the notification workspace; it is not a mandatory layout for every product screen.

**Key Characteristics:**

- Quiet light and dark surfaces with readable cyan action ink.
- Compact controls, soft corners, visible borders, and restrained depth.
- Explicit lifecycle labels and real reader or delivery facts.

## Colors

The frontmatter preserves the canonical OKLCH values from the stylesheet. Unsuffixed entries describe light mode; `-dark` entries document the corresponding `.dark` overrides. Use the application's semantic CSS variables so the theme changes together.

### Primary

**Cool cyan** marks primary actions, selected content, and unread emphasis. **Cyan ink** is the stronger foreground for links and small accent details. The primary foreground remains dark on the cyan button in both themes.

### Secondary

**Pale cyan** is the existing secondary button and badge fill. Retain it where a secondary variant is already used.

### Neutral

**White and zinc** supply background, card, popover, text, muted text, borders, inputs, and hover surfaces. Dark mode lifts card and popover surfaces above the dark page. Destructive color is reserved for errors and destructive actions.

**The Semantic Theme Rule.** Reuse semantic variables for dashboard surfaces and interactive states. Do not copy a light-mode color into a theme-aware component.

## Typography

**Body and heading font:** the actual `--font-geist-sans` fallback stack recorded in the frontmatter. The variable is named Geist, but the current root layout imports no Geist webfont; the browser selects from the system sans serif stack. Do not assume a downloaded Geist face is present.

Page headings use the headline role above the small breakpoint and the compact role below it. Sheet and composer titles use the title role. Body descriptions favor relaxed reading; controls use the label role, and dates and supporting counts use metadata. Notification rows use medium or semibold titles; summary numbers use tabular numerals. No separate display face is established by this scope.

**The Reading Hierarchy Rule.** Keep message titles stronger than their excerpts, dates, and supporting labels; preserve the full message in the reader even when the inbox excerpt is clamped.

## Layout

The reused spacing steps in the frontmatter correspond to the existing Tailwind spacing rhythm. Notification pages use a broad list below a heading, channel navigation, a single divided summary strip, and adjacent filters. Table rows use generous vertical padding (1rem). The summary wraps into two columns on narrow screens and a horizontal group at the small breakpoint.

Notification detail uses a full-height right sheet, full width on narrow screens and capped at 42rem from the small breakpoint. Its header stays distinct while the detail body or audience list scrolls inside the available height. Pagination stays outside the audience scroll region.

The account Sessions page places its title and purpose above a two-tab workspace for Active sessions and Login history. Device rows stack their sign-out action below the device details on narrow screens and align it to the right at the small breakpoint. Login history uses selectable cards below the large breakpoint and a horizontally scrollable table at and above it; pagination follows the list. Attempt details open in a full-width sheet on narrow screens, capped at 37.5rem from the small breakpoint, with its header fixed above a bounded detail scroll area.

The composer is bounded by the viewport (`min(56rem, 94dvh)`), with persistent header and footer actions. At the large breakpoint, compose and preview use columns in a 1:0.9 ratio and scroll independently. Below that breakpoint, Compose and Preview tabs switch between those regions. Fixed actions here mean a persistent footer within the dialog, not an overlay positioned over page content.

The bell popover is capped by available popover height and viewport width. Its native list scroll is bounded to the smaller of 24rem or 55dvh; header and pagination remain outside that list. Reader dialogs cap their height to the viewport minus 2rem and scroll long message text. Buttons and inputs retain at least 44px height below the medium breakpoint.

## Elevation & Depth

Borders and muted tonal fills carry most grouping. Existing cards retain the shared small shadow, inputs and outline buttons retain the extra-small shadow, popovers use the medium shadow, and dialogs and sheets use the large shadow. These are the incumbent Tailwind shadow utilities; this scope adds no bespoke shadow vocabulary. Dialog and sheet backdrops use black at 50% opacity.

Dialog transitions use the existing short fade and zoom (200ms). Sheets use the existing slide with 500ms entry and 300ms exit. Notification loading indicators suppress their spin when reduced motion is requested. The sidecar records the observed timing and breakpoint extensions.

## Shapes

The radius scale derives from the existing base radius in the frontmatter. Controls use the medium radius, dialogs and field groupings use the large radius, and cards, inbox popovers, and announcement previews use the extra-large radius. Compact status badges use the full pill. Keep thin borders and the existing outlined vector icons from the UI libraries.

## Components

### Buttons

Primary buttons use cyan fill and its dedicated foreground. Outline buttons use a border and theme surface; ghost buttons keep low emphasis until hovered; links use cyan ink and an underline on hover. Buttons dim and stop interaction when disabled. Shared focus uses a visible ring (3px); row and navigation targets use their existing ring (2px). The frontmatter describes the default text-only desktop size; icon-bearing variants reduce horizontal padding and narrow-screen controls expand their touch height.

### Chips

Use the shared badge variants for lifecycle labels, with explicit status text. An outlined badge is a compact factual label; secondary fill can accompany a reader count. Preserve the actual status mapping in the channel implementation rather than inventing a new palette for a missing state.

### Cards / Containers

The shared card has a thin border, extra-large corners, card surface and foreground, and a small shadow. Its default internal rhythm uses the largest documented component spacing. Notification lists use a bordered container and dividers without a card shadow. The Schedule and Campaign lifecycle detail cards also explicitly suppress the shared shadow, using their border as the surface boundary. Summary values stay in one strip rather than becoming isolated decorative metric cards.

### Inputs / Fields

Inputs have a transparent base, a semantic input border, medium corners, and an extra-small shadow. Dark mode adds a translucent input fill. Focus uses the ring token; invalid fields use destructive border and ring; disabled fields dim. On narrow screens input text remains at the base size to support readable editing. Message text areas inherit the same border and focus treatment and can resize vertically.

### Navigation

Notification channels are actual route links with a foreground underline for the active page, muted text at rest, foreground on hover, and visible keyboard focus. Composer and detail tabs retain the shared Tabs primitive. Icon-only refresh, menus, bell, and pagination controls keep accessible names.

### Notification list and detail

A row opens its channel's right detail sheet. Row menus expose available lifecycle actions. Filters, count descriptions, and pagination reflect backend results. In-app audience inspection labels the scope of unread records accurately; email recipients show actual delivery outcomes. Do not fabricate reach or open statistics.

### Composer and preview

Form and preview share the bounded composer described in Layout. Closing a dirty composer asks whether to discard changes, and saving prevents duplicate interaction. Previews are inert representations. In-app previews reuse dashboard theme tokens. The email preview intentionally represents the delivered email template: a fixed light canvas, blue call-to-action, and email-specific typography. Its template colors are scoped to that preview and are not dashboard palette additions. The bordered white email preview surface suppresses the shared small shadow.

### Bell inbox and reader

Unread rows use a faint cyan fill, stronger title, and status dot. Clicking a row opens the full announcement and marks it read. Read history remains available; Read again reopens the same reader while preserving read status. A separate optional link opens the announcement's URL. Loading, empty, failure, retry, and pagination states remain explicit. Long titles, bodies, and URLs wrap within the bounded panel.

### Account sessions

Keep current device access and past sign-in activity in one compact workspace with two familiar tabs. Active-session rows pair a browser and device label with IP and relative activity time; mark the current device with a subtle cyan pill. Keep individual sign-out actions with their device rows and place sign-out-all beside refresh, using the shared destructive confirmation dialog before either action. Login history uses the existing status badge and semantic success/failure colors, with responsive cards for smaller screens and a table for wide screens. Selecting an attempt opens a bounded detail sheet that groups status, device, network, and security context; preserve readable wrapping for IP addresses, identifiers, and user-agent strings.

## Do's and Don'ts

### Do:

- **Do** inherit semantic colors, shared controls, and the documented radius scale.
- **Do** retain keyboard focus, accessible icon labels, and native bounded scrolling.
- **Do** reuse the notification list-to-detail interaction across the two channels.
- **Do** show honest lifecycle, schedule, read, and recipient data with appropriate empty and retry states.

### Don't:

- **Don't** promote the email template's fixed light palette into dashboard theme tokens.
- **Don't** imply a whole-dashboard composition mandate from this notification extension.
- **Don't** replace read history with a disappearing unread-only inbox.
- **Don't** add illustrative statistics or audience controls unsupported by the API.
