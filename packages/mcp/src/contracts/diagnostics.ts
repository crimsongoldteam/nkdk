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

export type DiagnosticSummary = z.infer<typeof diagnosticSummarySchema>
export type DiagnosticReportReference = z.infer<typeof diagnosticReportSchema>
