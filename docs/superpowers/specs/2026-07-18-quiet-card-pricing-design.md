# Quiet card pricing — design

**Date:** 2026-07-18
**Status:** Approved

## Goal

De-emphasize prices on product tiles (collection, featured collection, search) so the
photo and product name carry the card, following the "smaller price feels cheaper /
keeps focus on product" merchandising principle. Product page and cart prices stay
untouched — clarity there converts and avoids checkout surprise.

## Changes

1. **Drop empty decimals** — `snippets/product-card.liquid`: render the product-branch
   price with `money_without_trailing_zeros` instead of `money`. "R$ 148,00" → "R$ 148";
   real cents (e.g. "R$ 89,90") are preserved, so the displayed price is never inaccurate
   (consumer-code safe). The placeholder branch receives a pre-formatted `ph_price`
   string and is unchanged.

2. **Shrink + mute** — `assets/theme.css` `.pcard__price`: 16px default ink →
   **13px, `var(--text-muted)`** (same tone as `.pcard__cat`). Hierarchy becomes
   22px display name → 13px quiet price.

## Out of scope

Product detail page price, cart line/total prices, any label-style (uppercase/tracked)
treatment of the price.

## Verification

Code inspection of the two touchpoints; visual check in Shopify theme preview after push.
