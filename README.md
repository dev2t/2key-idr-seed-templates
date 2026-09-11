# IDR catalog

This is **your** IDR shop JSON. You do not get the billing engine.

You **fill** this fork and **open pull requests**. Your billing contact will help with the JSON. You do not run apply.

When `main` updates, we get a trigger and apply **this repo** to the **IDR billing VM**. That apply is our job.

Scomm is a **different tenant** (`2key-scomm-seed-templates` → Scomm VM / Scomm DB). Do not copy this catalog there.

```
you fill (we help) → you PR → trigger → we apply on the IDR VM
```

## How you work

1. Edit root [`catalog.json`](catalog.json) (and [`auth.json`](auth.json) if you change first-login emails). **[docs/recipes.md](docs/recipes.md)** — plan titles are keys under `products.IDR.plans`.
2. Open a pull request into `main`. CI checks the file. New SKUs: `npm ci && npm run validate` and commit `hosts.json` (we can do this with you).
3. After merge, we apply when the trigger hits the IDR VM. Then check the shop.

## Do not

- Rename live keys (`"idr_personal_bundle"`, `"IDR"`, `"Personal Package"`). Add a new key; hide the old one.
- Delete a key people still pay for. Set `"isActive": false`.
- Hand-edit `hosts.json`, `schemas/`, or treat `examples/` as the live shop.
- Put passwords or IdP secrets in git.
- Apply this fork onto the Scomm billing VM.

Field list: [docs/catalog.md](docs/catalog.md). First-login file: [docs/auth.md](docs/auth.md).

Internal (us): [docs/stand-up.md](docs/stand-up.md), [docs/ci-and-ops.md](docs/ci-and-ops.md).
