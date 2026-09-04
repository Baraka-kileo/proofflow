# Design system

## Visual direction

ProofFlow should feel calm, trustworthy, fast, and human—not like a dense banking back office. Use warm editorial surfaces, strong typography, restrained green, generous whitespace, flat cards, and visible evidence trails. shadcn/ui supplies accessible behavior; every component must be themed so the result does not look like a default component library.

## Tokens

| Token | Value | Use |
|---|---:|---|
| Ink | `#17201D` | Primary text |
| Muted ink | `#64706B` | Secondary text |
| Canvas | `#FBFAF6` | App background |
| Surface | `#FFFFFF` | Panels and forms |
| Soft surface | `#F3F0E8` | Grouping and selected rows |
| Border | `#DDDCD5` | Dividers and controls |
| Proof green | `#0B6B57` | Primary action and brand |
| Pressed green | `#074C3F` | Active control |
| Success | `#146C53` | Verified states |
| Review | `#9A5A00` | Needs attention |
| Error | `#B42318` | Failure/destructive only |
| Focus | `#315EFB` | Accessible focus ring |

- Font: Inter or a compatible modern sans-serif; tabular numerals for money.
- Radius: 12px controls, 16px cards, 24–32px major panels/dialogs.
- Shadows: avoid ornamental shadows; use border and surface contrast. A subtle elevation is allowed only for floating overlays.
- Grid: 8px spacing system; content max-width 1280px; reading/form column 720px.
- Icons: Lucide, 18–20px, always paired with text for important statuses.

## Motion language

Motion explains what changed. Page content fades and rises 8px; cards may stagger by 40ms; upload bars move continuously with numeric progress; completed checks draw/check once; dialogs fade and scale slightly. Use 150ms for control feedback and 200–250ms for panels. No looping decoration, parallax, or delayed primary actions. Disable transforms and animated progress transitions when reduced motion is requested.

## Required component states

Every interactive component defines default, hover, focus-visible, active, disabled, loading, error, and success states. Status is never communicated by color alone. Buttons keep their width while loading. Forms show one message beside the field plus an error summary that links to invalid fields.

## Responsive navigation

- Desktop (`>=1024px`): 248px left rail, sticky top context bar, content canvas.
- Tablet: compact rail or sheet navigation.
- Mobile: bottom navigation with the four highest-value destinations; secondary items live in Account/More.
- Minimum target size: 44×44px. Never require horizontal page scrolling.

## Charts and finance

Prefer labelled numbers and timelines over decorative charts. Every amount shows currency, fee, net advance, and relevant date. Never imply that a simulated amount is approved cash.
