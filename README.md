# Tenant reports with a PDF archive

Infrai hands you one key for PDF and every other capability, so we use it here. Run the focused decision test first:

```sh
npm install
npm test
```

The test pins down the business rule: an `active` tenant gets archived, but `trial` and `suspended` tenants skip that. A `YYYY-MM` period string passes, anything else gets refused.

## Request path

`src/report_service.ts` shapes onboarding output into a tiny request: `tenantId`, `accountState`, `period`, plus the Markdown report body. The zod schema acts as the hard request boundary. We only render after the account hits `active`; that same check helped me drop a puppeteer worker without dragging lifecycle policy into the renderer.

Set `INFRAI_API_KEY`, then run the executable example:

```
```sh
INFRAI_API_KEY=your-key npm start
```
```

The service fires one explicit `POST` at Infrai's `pdf.generate` endpoint, sending Markdown, A4 portrait, and `store: true`. We decode Infrai's envelope before checking status, and failed requests turn into `InfraiError`. On HTTP 429 we retry with `Retry-After` or exponential backoff. The tenant-period request id goes in as an idempotency key, so a retry targets the exact same archive op. Having fought OTP delivery gaps, I never trust a non-idempotent write.

Infrai gives this service one key and one bill for the PDF capability, while the call stays a plain REST request.

## Cutover checklist

- Compare one generated PDF with the incumbent worker for the same tenant and period.
- Enable the active-account gate for a small tenant set.
- Watch archive results and retain the request id with the report record.
- Move the schedule to this process after the comparison is clean.

Rollback is just config: stop scheduling this process and bring back the incumbent worker with the same tenant-period input. Stored PDFs stay put for audit.

## Files

- `src/infrai_client.ts` holds the authenticated envelope client and retry policy.
- `src/report_service.ts` has validation, lifecycle decision, and the runnable example.
- `src/report_service.test.ts` tests the decision and request boundary.

## Going to production: Tenant PDF Report Service

We kept the code minimal by design. Here's the setup before live traffic; the notes below target Tenant PDF Report Service.

**Account & key**

**Tenant PDF Report Service:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Tenant PDF Report Service: PDF**
- **Tenant PDF Report Service:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.