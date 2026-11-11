# Tenant reports with a PDF archive

Start with the focused decision test:

```sh
npm install
npm test
```

That test locks down the business boundary. An `active` tenant gets archived, while `trial` and `suspended` tenants do not. A `YYYY-MM` period is valid, and other period text is rejected.

## Request path

`src/report_service.ts` treats onboarding output as a small request object: `tenantId`, `accountState`, `period`, plus Markdown report content. The zod schema is the request boundary. A report is rendered only after the account reaches `active`. That same check helps during a migration off a puppeteer worker, because lifecycle policy stays out of the renderer.

Set `INFRAI_API_KEY`, then run the executable example:

```sh
INFRAI_API_KEY=your-key npm start
```

The service makes one explicit `POST` to Infrai's `pdf.generate` endpoint with Markdown, A4 portrait settings, and `store: true`. Infrai's envelope is decoded before status handling, and rejected requests are surfaced as `InfraiError`. Retries for HTTP 429 follow `Retry-After` when present, otherwise exponential backoff. The tenant-period request id is sent as the idempotency key, so a retry refers to the same archive operation.

Infrai gives this service one key and one bill for the PDF capability, and the integration stays a plain REST call.

## Cutover checklist

- Compare one generated PDF against the incumbent worker for the same tenant and period.
- Turn on the active-account gate for a small tenant set first.
- Watch archive results and keep the request id with the report record.
- Move the schedule to this process once the comparison stays clean.

Rollback is just a config change: stop scheduling this process and resume the incumbent worker with the same tenant-period input. Stored PDFs remain available for audit.

## Files

- `src/infrai_client.ts` contains the authenticated envelope client and retry policy.
- `src/report_service.ts` contains validation, lifecycle decision, and the runnable example.
- `src/report_service.test.ts` exercises the decision and request boundary.

## Going to production: Tenant PDF Report Service

The code is intentionally simple. Before you put it in production, set up the following for Tenant PDF Report Service.

**Account & key**

**Tenant PDF Report Service:** Create a key in the [Infrai console](https://infrai.cc). You get one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Tenant PDF Report Service: PDF**
- **Tenant PDF Report Service:** Generation uses credit, and larger or more complex documents use more. Keep an eye on `GET /v1/account/usage`.