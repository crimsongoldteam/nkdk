import { z } from "zod/v4"

export const diagnosticSummarySchema = z.object({
  errors: z.number().int().nonnegative(),
  warnings: z.number().int().nonnegative(),
  shown: z.number().int().nonnegative().max(100),
  omitted: z.number().int().nonnegative(),
})

export const diagnosticReportSchema = z.object({
  uri: z.string().url(),
  format: z.literal("application/x-ndjson"),
})

export const metadataDiagnosticSchema = z.object({
  severity: z.enum(["error", "warning"]),
  message: z.string(),
  code: z.string().optional(),
  filePath: z.string().optional(),
  path: z.string().optional(),
  kind: z.string().optional(),
  name: z.string().optional(),
  targetProjectPath: z.string().optional(),
})

export const diagnosticOutputShape = {
  diagnostics: z.array(metadataDiagnosticSchema),
  summary: diagnosticSummarySchema,
  truncated: z.boolean(),
  report: diagnosticReportSchema.optional(),
}

export type DiagnosticSummary = z.infer<typeof diagnosticSummarySchema>
export type DiagnosticReportReference = z.infer<typeof diagnosticReportSchema>
