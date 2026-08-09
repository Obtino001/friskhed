# Friskhed.dk — Theme comparison status

**Source:** Obtino internal, August 2026 — *New Live Theme vs Old Theme (“test gammel”)*  
**Audit date:** 9 August 2026  
**Scope:** Horizon theme codebase (this repo), not live Shopify admin discounts/shipping rates.

**Bottom line from Obtino:** new theme looks better; old theme sold better because trust and message were stripped. Fix = restore trust layer, then Shoplift A/B.

**Audit bottom line:** parity items 1–3 and most of 4–10 are in the theme. Conversion still depends on **admin** (shipping 149, automatic 3/5-pack discounts, menthol metafields, wallet checkout, Shoplift test).

---

## Scoreboard

| Bucket | Done in theme | Partial | Admin / not run |
|---|---|---|---|
| Ship now (#1–4) | 3 | 1 | Checkout wallets |
| A/B list (#5–10) | 5 | 1 | Metafields + Shoplift |
| 3 bigger plays | Theme merchandising | — | Discounts + shipping rates + kit SKU |
| Keep (new theme wins) | Sticky ATC, breadcrumbs, cart bar, PDP stars | — | — |

Canonical Trustpilot claim used everywhere in theme settings: **4,9 ★ · 469 anmeldelser**.

Legal identity in theme: **Friskhed.dk ApS · CVR 43519379 · Lunikvej 20b, 2670 Greve · kontakt@friskhed.dk**.

> Obtino’s old theme listed **Glentevej 45, 4600 Køge**. Confirm with client which address is current for e-handelsloven. Gmail `Friskhed1@gmail.com` is removed from footer/contact/om-os.

---

## Element table (old vs new vs now)

| Element | Old (test gammel) | New live (before work) | Now in this theme | Status |
|---|---|---|---|---|
| Footer identity | ApS, CVR, address, kontakt@ | Gmail, no CVR, phone not for support | ApS + CVR + Lunikvej + kontakt@ | **Done** |
| Top bar Trustpilot | 469 reviews + logo | Rotating shipping only | Trust announcement bar: 4,9 / 469 + USPs | **Done** |
| Trustpilot numbers | One claim | 1000+ / 400+ / 4,7 mixed | One claim 4,9 / 469 | **Done** |
| Buy box shipping | Fri levering 450 + på lager | Stock only, delivery in accordion | Gratis fragt 149 + på lager · 1–3 dage above ATC | **Done (theme)** |
| Payment icons | 5 labeled incl. Apple/Google Pay | 3 small | Visa, Mastercard, MobilePay, Apple Pay, Google Pay | **Done (theme)** — verify wallets in Shopify Payments |
| Welcome popup | 10% email | Removed | Snippet popup, theme setting on | **Done** |
| Hero | Static, instant | Video, blank LCP | Static image + menthol H1 | **Done** |
| Product cards | Hero story + KØB NU | Badge noise, dup carousels, sold-out Tilføj | Fast Selling off; carousels still on 2 HP lists; quick-add Tilføj still shows sold-out | **Partial** |
| PDP reviews | None | Stars (wrong number) | 4,9 / 469 + 3 stacked quotes | **Done** (quotes not DJ/Ole/Lisa P) |
| Sticky ATC | None | Yes | Yes | **Keep** |
| Cart progress | Standard | Bar (threshold wasted at 450) | Bar at 149 + mix nudge + upsell | **Done (theme)** |
| Breadcrumbs | None | Yes | Yes | **Keep** |
| Relaterede produkter | Populated | Empty heading | Hide when recs empty | **Done** |
| Contact consistency | kontakt@ everywhere | PDP vs footer mismatch | kontakt@ footer, contact, om-os, PDP | **Done** |

---

## Fix list 1–10

### 1. Footer identity — **Done**
Legal block + `snippets/company-identity.liquid`. Settings: `company_*`. Footer-group JSON uses kontakt@, not Gmail.

### 2. One Trustpilot claim — **Done**
Settings `trustpilot_rating` / `trustpilot_review_count`. Hero, homepage reviews slider, PDP stars, sales points, trust bar all 4,9 / 469.

### 3. Buy box reassurance — **Done (theme)**
Sales points: gratis fragt 149, levering 1–3, Trustpilot. Shipping line: på lager · 1–3 hverdage. Payment row: 5 methods. **Admin:** Settings → Payments wallets; Settings → Shipping free from **149** (not 450/499).

### 4. Clean the noise — **Partial**
| Sub-item | Status |
|---|---|
| Fast Selling badges off | Done (`show_fast_selling_badge: false`) |
| Empty Relaterede produkter | Done (no catalog fallback) |
| PDP sold-out = text not Tilføj | Done (`buy-buttons.liquid`) |
| Hide sold-out quick-add Tilføj | **Open** |
| Deduplicate nested / mobile carousels | **Open** (`carousel_on_mobile: true` on two homepage featured collections) |

### 5. PDP review quotes — **Done (theme) / A/B still optional**
Stacked quotes (not carousel). Current authors: Jan, Inge Nielsen, Camilla. Obtino suggested DJ, Ole, Lisa P verbatim — swap in editor if client wants those exact quotes.

### 6. Hero static + customer language — **Done (theme) / A/B optional**
Static image. H1: *Den mentholsmag du mangler*. Sub: aroma-kugler + 4,9 / 469. Tobacco wording left as brand/legal decision.

### 7. Menthol strength guide — **Theme done / metafields admin**
PDP block `custom.menthol_strength` 1–5. Collection cards do not show the scale yet.

### 8. 10% welcome popup — **Done**
`snippets/welcome-popup.liquid` + `welcome_popup_enable: true`. Needs matching automatic 10% discount in admin.

### 9. Cart cross-sell — **Done**
Applicator + scent mix. Color applicator setting exists (`cart_upsell_applicator_alt`) — select in theme editor. PDP also has complete-order row.

### 10. Dispatch cutoff 15:00 — **Done (theme)**
Trust bar + `dispatch_cutoff_hour: 15`. Honest 1–3 days still in buy box.

---

## 3 bigger plays

| Play | Theme | Admin still required |
|---|---|---|
| **1. Mix 3 ≈ 49 / 5 ≈ 75** | Homepage cards, PDP banner → `?mix=3`, collection picker, cart nudge | Automatic discounts: 3 from `aroma-kugler` = 49 kr; 5 = 75 kr. Applicators must **not** be in that collection. |
| **2. Free shipping ~149** | Progress bar, USPs, sales points, mix copy all 149 | Shopify shipping rates must be free from 149 (live site has shown 450/499). |
| **3. Starter kit** | Card + mix `?mix=starter` + applicator checkbox | Optional combo discount / kit SKU if ads need a product. |

---

## Next step (Obtino)

1. Admin: shipping 149, mix automatic discounts, 10% popup discount, menthol metafields, wallets, Color applicator in theme settings.  
2. Optional cleanup: hide sold-out quick-add; turn off homepage `carousel_on_mobile`.  
3. Shoplift: old theme vs **this** theme (trust layer on). Snippet already in `layout/theme.liquid`.

No lift % promised — test result is the only number that counts.

---

## File map (where the trust layer lives)

| Area | Files |
|---|---|
| Identity | `config/settings_schema.json`, `settings_data.json`, `snippets/company-identity.liquid`, footer-group / om-os / contact JSON |
| Trustpilot | `snippets/trustpilot-claim.liquid`, trust bar, hero / PDP / reviews JSON |
| Buy box | `templates/product.json`, `_sales-points`, `_shipping`, `snippets/payment-icons.liquid` |
| Mix offers | `sections/mix-bundle-offers.liquid`, `_mix-pack-offer.liquid`, `snippets/mix-pack-picker.liquid`, `assets/mix-pack-picker.js` |
| Cart | `snippets/cart-upsell.liquid`, `mix-pack-nudge.liquid`, `progressbar.liquid` |
| Popup | `snippets/welcome-popup.liquid` |
| Strength | `blocks/_strength-guide.liquid` |
