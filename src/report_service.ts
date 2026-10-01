import { z } from "zod";
import { infraiPdfGenerate } from "./infrai_client.js";

export const ReportRequest = z.object({
  tenantId: z.string().min(1),
  accountState: z.enum(["trial", "active", "suspended"]),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  markdown: z.string().min(1)
});
export type ReportRequest = z.infer<typeof ReportRequest>;

export function canArchive(state: ReportRequest["accountState"]): boolean { return state === "active"; }

export async function renderAndArchive(input: unknown): Promise<{ archived: boolean; pdf: unknown }> {
  const request = ReportRequest.parse(input);
  if (!canArchive(request.accountState)) return { archived: false, pdf: null };
  const pdf = await infraiPdfGenerate({ markdown: request.markdown, page_size: "A4", orientation: "portrait", store: true }, `tenant-report:${request.tenantId}:${request.period}`);
  return { archived: true, pdf };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample = { tenantId: "clinic-42", accountState: "active", period: "2026-08", markdown: "# Monthly privacy report\n\nNo unresolved access events." };
  renderAndArchive(sample).then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
