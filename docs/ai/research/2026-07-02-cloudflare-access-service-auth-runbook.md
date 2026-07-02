# Cloudflare Access Service Auth Runbook

Date: 2026-07-02
Status: Repo-side configuration contract documented; external Cloudflare setup not executed

## Goal

Cloud Run IAM/Google ID token을 대체하는 경계를 Cloudflare Access Service Auth로
구성합니다. 목표는 browser가 `BACK_API_ORIGIN`을 직접 호출해도 back까지 도달하지
않고, Cloudflare Workers/OpenNext front의 `/api` proxy만 back으로 갈 수 있게 하는
것입니다.

## What Cloudflare Access Does Here

```text
browser
-> ittaesalgeol.com/api/*
-> OpenNext front route handler
-> adds Cloudflare Access service token headers
-> BACK_API_ORIGIN
-> Cloudflare Access Service Auth
-> Cloudflare Tunnel
-> EC2 local back container
```

Cloudflare Access는 NestJS app 앞에서 먼저 검사합니다. service token이 없거나 틀리면
Tunnel, EC2, Docker container, NestJS code까지 요청이 도달하면 안 됩니다.

## Cloudflare Objects To Create

### 1. Service Token

- Name: `trading-front-prod`
- Purpose: OpenNext front `/api` proxy가 `BACK_API_ORIGIN`에 접근할 때만 사용
- Generated values:
  - Client ID
  - Client Secret

Storage rule:

- Client ID and Client Secret are Cloudflare Worker secrets only.
- Do not store them in GitHub Secrets.
- Do not store them in AWS Parameter Store.
- Do not write them to repo docs, config files, workflow files, or logs.

### 2. Access Application

- Application type: self-hosted application
- Domain: `BACK_API_ORIGIN` hostname
- Path scope: all API paths for this back origin
- Policy:
  - Action: `Service Auth`
  - Include selector: `Service Token`
  - Include value: `trading-front-prod`

Do not add a broad `Allow` policy for users to this application. A user login policy would
make the back origin reachable from a browser after login, which is not the target boundary
for this architecture.

### 3. Worker Runtime Secrets

The OpenNext front worker needs these runtime values:

```text
API_BASE_URL=BACK_API_ORIGIN
CF_ACCESS_CLIENT_ID=<service token client id>
CF_ACCESS_CLIENT_SECRET=<service token client secret>
```

`API_BASE_URL` is also kept out of repo config. It is injected into the Cloudflare Worker
environment during deployment or set directly as a Cloudflare secret/value.

## Repo Contract

Current repo code already matches this contract:

- `front/src/app/api/[...path]/route.ts`
  - keeps the browser-facing contract as same-origin `/api/*`
  - builds the upstream URL from `process.env.API_BASE_URL`
  - removes incoming `CF-Access-*` service token headers from browser requests
  - applies Worker env service token headers before calling `BACK_API_ORIGIN`
- `front/src/server/cloudflare-access.ts`
  - reads `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` from the OpenNext
    Cloudflare runtime env
  - sets `CF-Access-Client-Id` and `CF-Access-Client-Secret` on upstream requests

The back application code must not implement a custom header guard for this boundary.

## Verification

After external Cloudflare setup, verify these cases:

1. Direct no-token call to `BACK_API_ORIGIN`
   - Expected: Cloudflare Access rejects it before EC2/back.
   - Back logs should not show the request.
2. Front proxy call to `https://ittaesalgeol.com/api/*`
   - Expected: request reaches back through Access and Tunnel.
3. Spoofed browser request with fake `CF-Access-Client-Id` and
   `CF-Access-Client-Secret` to `https://ittaesalgeol.com/api/*`
   - Expected: front route removes those incoming headers and overwrites them with
     Worker env values.
4. Direct call to `BACK_API_ORIGIN` with the real service token headers
   - Expected: Access allows it.
   - This is only a credential test; do not expose the real values outside the
     deployment operator context.

## Source Notes

- Cloudflare documents service tokens as Client ID and Client Secret credentials for
  automated systems protected by Access:
  `https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/`
- Cloudflare documents Service Auth policy as the policy action that accepts a service
  token instead of a browser identity-provider login:
  `https://developers.cloudflare.com/cloudflare-one/access-controls/authenticate-agents/`
- Cloudflare documents the request headers as `CF-Access-Client-Id` and
  `CF-Access-Client-Secret`.
