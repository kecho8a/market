# TODO - WhatsApp + PWA + Charts + CSP fixes

## 1) Fix PWA manifest warning (invalid start_url)
- ✅ File: `src/components/SEOHead.tsx`
- ✅ Removed/disabled the runtime `Blob` manifest injection (prevents invalid manifest fields/scope).
- ✅ Uses static `public/manifest.json` via `<link rel="manifest" href="/manifest.json" />` in `index.html`.

## 2) Fix WhatsApp launcher error (whatsapp:// handler not registered)
- ✅ File: `src/App.tsx`
- ✅ Replaced `whatsapp://send?...` usage with `https://wa.me/<phone>?text=...`.

## 3) Tighten WhatsApp URLs in Checkout flow
- ✅ File: `src/pages/Checkout.tsx`
- ✅ Prefer `wa.me` for mobile/desktop (removed `api.whatsapp.com/send` desktop retry URL).

## 4) Fix Recharts ResponsiveContainer sizing warning
- ✅ File: `src/pages/Admin.tsx`
- ✅ Avoided `ResponsiveContainer height="100%"` without definite parent sizing.
- ✅ Set chart containers to `height={220}` for both charts.

## 5) Fix CSP font-src violations
- ✅ File: `index.html`
- ✅ Added a CSP meta tag allowing Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) and `data:` for font formats.
