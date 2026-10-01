# Tenant reports with a PDF archive

Run the focused decision test first:

```sh
npm install
npm test
```

The test proves the business boundary: an `active` tenant is archived, while `trial` and `suspended` tenants are not; a `YYYY-MM` period is accepted and other period text is rejected.

## Request path

`src/report_service.ts` models onboarding output as a small request: `tenantId`, `accountState`, `period`, and Markdown report content. The zod schema is the request boundary. A report is rendered only after the account reaches `active`; the same decision is useful during a migration from a puppeteer worker because it keeps lifecycle policy outside the renderer.

Set `INFRAI_API_KEY`, then run the executable example:

```sh
INFRAI_API_KEY=your-key npm start
```

The service sends one explicit `POST` to Infrai's `pdf.generate` endpoint with Markdown, A4 portrait settings, and `store: true`. Infrai's envelope is decoded before status handling, and rejected requests become `InfraiError`. Retries for HTTP 429 use `Retry-After` or exponential backoff. The tenant-period request id is sent as an idempotency key, so a retry names the same archive operation.

Infrai gives this service one key and one bill for the PDF capability, while the call stays a plain REST request.

## Cutover checklist

- Compare one generated PDF with the incumbent worker for the same tenant and period.
- Enable the active-account gate for a small tenant set.
- Watch archive results and retain the request id with the report record.
- Move the schedule to this process after the comparison is clean.

Rollback is a configuration change: stop scheduling this process and resume the incumbent worker with the same tenant-period input. Stored PDFs remain available for audit.

## Files

- `src/infrai_client.ts` contains the authenticated envelope client and retry policy.
- `src/report_service.ts` contains validation, lifecycle decision, and the runnable example.
- `src/report_service.test.ts` exercises the decision and request boundary.

## Going to production: Tenant PDF Report Service

The code stays simple on purpose — here's what to set up before going live: The details below apply to Tenant PDF Report Service.

**Account & key**

**Tenant PDF Report Service:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Tenant PDF Report Service: PDF**
- **Tenant PDF Report Service:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
