# Help them fill; apply on trigger (internal)

**Audience: us.** They never get the billing engine.

IDR **owns this fork**. They fill and raise PRs. We sit with them on the JSON. We do **not** own their catalog or their PRs.

**Our ops job:** when we get `catalog-seed-updated` for this `catalog_repo`, apply that SHA on the **IDR billing VM**. Do not apply this fork onto the Scomm VM (or any other tenant).

```
they fill + PR (we help)
merge to main → dispatch { sha, ref, catalog_repo }
we apply that commit on the IDR VM
```

Canonical blank: [`2keyapp/2key-seed-templates`](https://github.com/2keyapp/2key-seed-templates).

Scomm: sibling `2key-scomm-seed-templates` → Scomm VM / Scomm DB only.

## This tenant (IDR)

- GitHub: `dev2t/2key-idr-seed-templates`
- Live files: root `catalog.json` / `auth.json` (not `examples/`)
- Trigger → apply on the IDR VM only (`BILLING_SEED_DIR` / `--dir` pointing at this checkout @ payload `sha`)
- Database, Stripe, IdP, and portal origin are **this** deployment’s, not Scomm’s

## Sitting with them

Support on **their** branch. If CI is red, they fix (we help). We do not take over the PR.

- [examples/sample-shop/](../examples/sample-shop/) is shape only. Do not copy it over IDR’s live root.
- `npm ci && npm run validate`; they commit `hosts.json` on their PR.
- Recipes: [recipes.md](recipes.md). Field list: [catalog.md](catalog.md).

## On trigger (apply)

Checkout this repo at `sha`. Against the **IDR** VM’s DB:

```bash
billing-seed validate --dir .
billing-seed apply --dir .
```

See [ci-and-ops.md](ci-and-ops.md). If apply fails (unknown currency, omitted live SKU), that is a catalog/VM mismatch — we tell them; we do not silently rewrite their JSON.

## Do not

- Apply IDR’s catalog onto the Scomm VM
- Apply Scomm’s catalog onto the IDR VM
- Mix both catalogs into one Postgres database
- Fill and merge as if this repo were ours
- Give them the billing engine, Stripe keys, or SQL
