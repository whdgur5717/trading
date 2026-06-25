# Decision: Backend External API Test Boundary

Date: 2026-06-20
Status: Accepted

## Context

Back e2e tests need to verify the real Nest HTTP boundary while preventing KIS,
FSC, and OpenDART calls from reaching production upstream services.

## Decision

- Use one MSW server for outbound HTTP in back e2e tests.
- Keep handlers and upstream response data split by provider under
  `back/test/support/external/{kis,fsc,opendart}`.
- Do not place provider responses in a shared `fixture/http` bucket.
- Name and organize upstream responses by the external provider REST contract,
  not by our endpoint scenario name.
- FSC/OpenDART upstream response bodies live under
  `responses/<endpoint>/<http-status>/<provider-code>.json`. The endpoint
  directory uses the provider's public endpoint name.
- Default FSC/OpenDART handlers return the normal provider response body for the
  endpoint the adaptor calls. Tests that need failure or no-data behavior choose
  a provider code JSON and override the handler in that spec.
- External handlers do not throw synthetic JavaScript errors for provider
  failures. Provider failure bodies go through the existing adaptor parser and
  market-data error mapper.

## Consequences

- `/jobju/score` can exercise controller, service, market facade, FSC adaptor,
  and OpenDART adaptor without real external network calls.
- Adding a new external provider requires a new provider folder rather than
  growing a mixed fixture directory.
- Existing KIS e2e imports keep working through `back/test/support/kis/http.ts`.

## Verification

- `pnpm --filter back test:e2e` passed with 6 files and 9 tests.
- `pnpm --filter back type-check` passed.
- `rg -n "throw new Error|opendartNoData|fscError" back/test/support/external`
  returned no matches after the handler cleanup.
- The external test support was checked for leftover request/response mapping
  terms, generated-data helpers, broad casts, and raw URL folder names; no
  FSC/OpenDART code matches remained after the response-body refactor.
