import assert from "node:assert/strict";
import { canArchive, ReportRequest } from "./report_service.js";

assert.equal(canArchive("active"), true);
assert.equal(canArchive("trial"), false);
assert.equal(canArchive("suspended"), false);
assert.equal(ReportRequest.safeParse({ tenantId: "t1", accountState: "active", period: "2026-08", markdown: "# report" }).success, true);
assert.equal(ReportRequest.safeParse({ tenantId: "t1", accountState: "active", period: "August", markdown: "# report" }).success, false);
console.log("report decision tests passed");
