# Gumroad landing pages

Source for custom Gumroad product landing pages, kept here so the page can be
edited and republished without rebuilding it from scratch.

## landing.html

Custom landing page for the **Oracle Fusion Cloud Period Close Accelerator**
(Gumroad product id `yfywdq`).

- One self-contained file: inline CSS and JS, no external images or fonts.
- The product mock (master close tracker) is drawn in pure CSS, so nothing is
  blocked by Gumroad's sandbox.
- Light and dark mode, responsive, accessible, with three buy buttons wired to
  `data-gumroad-action="buy"` and live `name` / `price` fields.

### Publish or update (Gumroad CLI)

`$exe` is the path to `gumroad.exe`, `$page` is the path to this file.

```powershell
# 1. Dry run: check the sanitizer does not strip anything important.
& $exe products page preview yfywdq $page --json --jq '{warning: .warning, report: .sanitization_report}' --no-input --non-interactive

# 2. Publish once the preview is clean.
& $exe products page publish yfywdq $page --json --jq '{warning: .warning, report: .sanitization_report}' --no-input --non-interactive

# 3. Confirm the live URL.
& $exe products page url yfywdq --json --jq '.product.landing_url' --no-input --non-interactive

# Revert to Gumroad's default product page.
& $exe products page clear yfywdq --yes --json --no-input --non-interactive
```

A clean preview removes only `<meta charset>`, `<meta viewport>` and `<title>`
("tag not in allowlist"). That is expected: Gumroad's own page wrapper supplies
those. As long as `warning` is `null` and no buy element is removed, the page is
safe to publish.
