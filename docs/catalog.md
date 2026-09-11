# `catalog.json`

Day-to-day changes (price, description, hide a SKU): **[recipes.md](recipes.md)**. This page is the field list.

Do not put database ids in this file. We assign those when we apply the catalog to your billing.

Keep `"$schema": "./schemas/catalog.schema.json"` at the top.

**IDR live data is root `catalog.json`.** Product `IDR`. Surface `idr`. Host `idrAgent`. `examples/` is not the shop. Scomm is a **different tenant** and a different repo.

## Example shape

```json
{
  "$schema": "./schemas/catalog.schema.json",
  "schemaVersion": 1,
  "surfaces": ["web", "desktop"],
  "platforms": ["linux"],
  "hosts": {
    "web": { "surfaces": ["web"] },
    "desktop": { "surfaces": ["desktop"], "excludePlatforms": ["linux"] }
  },
  "products": {
    "ExampleProduct": {
      "description": "What this product is",
      "isActive": true,
      "offerings": {
        "basic": {
          "displayName": "Basic",
          "resources": {
            "addonCode": "basic",
            "surfaces": ["web", "desktop"]
          }
        },
        "linux_build": {
          "displayName": "Linux build",
          "resources": {
            "addonCode": "linux_build",
            "surfaces": ["desktop"],
            "platforms": ["linux"]
          }
        }
      },
      "plans": {
        "Basic annual": {
          "offeringCodes": ["basic"],
          "pricings": {
            "annual": { "currency": "USD", "basePrice": 10 }
          }
        }
      }
    }
  }
}
```

You choose the words (`web`, `desktop`, host names, product names). Empty `"products": {}` is valid **only on the blank template**. A tenant fork must be filled before we apply.

## What each part is

| You fill | Meaning |
|----------|---------|
| `surfaces` | Labels for “which kind of app” (email vs office, web vs desktop, …). List them here before you use them on a SKU. |
| `platforms` | Extra OS labels (today: `linux` if you have a Linux-only SKU). |
| `hosts` | Your apps. Each host lists which `surfaces` it sells. Optional `excludePlatforms` hides Linux-only SKUs from a desktop host. |
| `products` | What customers buy under. IDR’s live product is root `"IDR"`. Empty `{}` is not this fork. |
| `offerings` | **What the app unlocks** (codes your apps check). No price. One offering can sit on several plans. |
| `plans` | **What the shop sells** (priced SKUs). `offeringCodes` must be offering keys **on that product**. |
| `pricings` | `annual` / `monthly` / … → `{ "currency": "USD", "basePrice": 10 }`. One currency per interval in this version. |

Optional `billingEngineTag` is a note for us (which catalog format this file was written against). `schemaVersion` is `1` for this format.

## Add-on details (`resources`)

| Field | Meaning |
|-------|---------|
| `surfaces` | Which of your surfaces this add-on belongs to. |
| `platforms` | Optional OS scope. |
| `addonCode` | Code the app uses to gate the feature. Defaults to the offering key. |
| `maxDevices` | Optional device cap. |
| `usageGrants` | Optional prepaid usage, e.g. `{ "my.meter": { "quantity": 1000 } }`. |

`npm run validate` checks the file shape. It will not catch a plan pointing at a missing offering, or a currency we have not enabled — we catch those when we apply.

## Hosts and `hosts.json`

You name hosts. You do **not** list offering codes by hand.

`npm run validate` writes `hosts.json` (product names + offering/addon codes, **no prices**). Commit it. Your apps should use that file. Do not edit it by hand.

A SKU appears on a host when:

1. It shares a surface with that host, and
2. It is not limited to platforms the host excludes (typical: Linux-only SKU skipped on desktop).

## Changing a live catalog

Day-to-day: [recipes.md](recipes.md). Summary:

| You want to | Do this |
|-------------|---------|
| Change price or copy | Edit `basePrice` / `description` / `displayName`. Leave the **key** alone. |
| Stop selling | `"isActive": false`. |
| New add-on or app | You add the keys (billing contact helps). Validate and commit `hosts.json`. PR. |
| Remove a SKU people still pay for | **Do not delete the key.** Hide it instead. |

Renaming a **key** is a new SKU, not a rename. Add a new key; hide the old one.

When the catalog **format** changes, we update `schemas/` in this repo. Pull that; do not edit schema files yourself.
