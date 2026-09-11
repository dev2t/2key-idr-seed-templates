# IDR Billing packages

Commercial SKUs for the IDR tenant. Source of truth is this fork’s root [`catalog.json`](catalog.json) (product `IDR`, surface `idr`, host `idrAgent`). Shop titles are **plan keys**; apps gate on **offering / addon codes**. After merge to `main`, ops applies this repo on the IDR billing VM (`billing-seed apply --dir .`). Do not apply this fork onto Scomm.

Day-to-day price/copy edits: [docs/recipes.md](docs/recipes.md). Field list: [docs/catalog.md](docs/catalog.md).

## Packages

| Shop title (plan key) | Offering key | Addon code | Price | Device seats | Package / Sources |
|-----------------------|--------------|------------|-------|--------------|-------------------|
| Personal Package | `idr_personal_bundle` | `idr_personal_bundle` | US$5 / year | 5 | `package`: `personal`. Authenticated Sources (mTLS). |
| Enterprise Package | `idr_enterprise_bundle` | `idr_enterprise_bundle` | US$25 / year | 5 | `package`: `enterprise`. Authenticated Sources (mTLS). |
| Service Provider Package | `idr_sp_target` | `idr_sp_target` | US$20 / year | 1 | `package`: `service_provider`. `allowsAnonymousSources`: true. |
| Usage-based billing | `data_transfer_1tb` | `idr_data_transfer_1tb` | US$10 / TB / year | — | Prepaid grant, not a seat. |

Offering `data_transfer_1tb` grants `resources.usageGrants` on meter `idr.transfer.bytes` (quantity `1099511627776` = 1 TiB, `validity_days` 365). Relay and TURN report against that shared `meter_key`.

Do not rename live keys (`IDR`, plan titles, offering keys, addon codes). Hide with `"isActive": false` instead.

## Rules

- **Device** = Target only (Sources are not seats). Caps come from `resources.maxDevices`.
- **Who pays data**: always the Target’s `paying_party` (to+from Target).
- **Meter**: `idr.transfer.bytes` — one wallet for Relay + TURN. Sources never report or get invoiced.
- **P2P WebRTC**: free (no Relay/TURN bytes).
- **Personal AuthZ**: same-entity; single-label host names.
- **Enterprise**: hierarchy, multi-admin, ZA, SCIM; paying party may differ from using party.
- **SP**: optional CNAME / LE; anonymous Sources OK.

## Presence entitlement (JWT)

There is **no** Presence↔Billing WSS mux. Target Agents mint a Presence entitlement JWT:

```http
POST /api/auth/agent/token
```

(Public surface: `https://auth.idr.to/api/auth/agent/token` → this Billing instance.) Agents present `entitlement_jwt` on `register_target`. Presence verifies via JWKS (`GET /api/auth/jwks`), caches claims, and gates register / accept_session / ensure_relay / mint_turn in-process.

Claims include `using_party`, `paying_party`, `target_fqhn`, `actions`, `features.package` / `allows_anonymous_sources`, and `subscription.*`. Catalog encodes the same package flags as `resources.package` and `resources.allowsAnonymousSources`. See Presence [AUTH.md](https://github.com/idrto/presence/blob/main/docs/AUTH.md).

**Not yet re-implemented** (formerly mux pushes): remote disconnect / admission kill, dynamic Entity CA-root push, domain alias push, `session_open`/`session_close` usage binding.

## Usage wallets (prepaid meters)

Data Transfer is a **prepaid meter wallet**, not a seat entitlement. Catalog offerings expose `resources.usageGrants` (`meter_key` → `{ "quantity": … }`) and optional `validity_days`. Checkout / renewal / top-up **credit** `usage_balances` for the paying party; balances are not tied to subscription lifetime.

Commercial transfer uses one wallet meter that both Relay and TURN report against (shared pool = one `meter_key`). Seat bundles remain separate offerings.

## Usage ingest / admit

`POST /api/v1/usage/report` (Bearer `USAGE_REPORTER_TOKEN`). Used by Relay and TURN reporters.

Relay and TURN flush when Δbytes ≥ **1 GiB** or Δt ≥ **24 h** (configurable), whichever first. Each interim packet carries a unique `idempotency_key`; inserts use `ON CONFLICT DO NOTHING` so retries never double-debit. Debit may leave `remaining` negative; on `remaining <= 0`, actions include `disconnect_session` with reason `volume_exhausted`.

`POST /api/v1/usage/admit` — gateways check `remaining > 0` before authorizing a new session. Top up anytime to restore admit.

Party fields on reports come from the Target session (JWT claims when auth is enabled).

TURN nodes: [idrto/turn](https://github.com/idrto/turn).
