# OpenAPI Error OneOf

Date: 2026-06-22

## Context

API error catalog already has code-specific message and description values, but
generated OpenAPI grouped errors by HTTP status with a single `code` enum and
the first message as the only example. That loses the contract for cases like
`404 unsupported-stock` versus `404 market-data-not-found`.

## Decision

OpenAPI error responses use code-specific schemas. If a status has multiple
error codes, the response schema is `oneOf`; each item fixes `success`,
`error.status`, and `error.code` with `const` and uses the matching catalog
message as the example.

## Consequences

- Generated clients can parse status-level failures as code-discriminated
  unions.
- Front mock tooling must expand error `oneOf` cases as separate variants
  instead of selecting the first schema.
- Error examples come from the shared backend error catalog, not ad hoc mock
  fixtures.

## Verification

- Regenerated `back/docs/openapi.json`.
- Regenerated front API client and mock operation catalog.
- Verified `/prices` 404/502 and `/jobju/score` 422 expose code-specific
  `oneOf` schemas.
- `pnpm --filter back type-check`
- `pnpm --filter front type-check`
