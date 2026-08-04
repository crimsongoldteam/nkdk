import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"
import { diagnosticReportSchema, diagnosticSummarySchema } from "./diagnostics"

export const validateProjectInputShape = {
  projectDir: z.string().min(1),
}

export const diagnosticSchema = z.object({
  filePath: z.string(),
  severity: z.enum(["error", "warning"]),
  message: z.string(),
  path: z.string().optional(),
})

export const validateProjectSuccessOutputShape = {
  ok: z.literal(true),
  diagnostics: z.array(diagnosticSchema),
  summary: diagnosticSummarySchema,
  truncated: z.boolean(),
  report: diagnosticReportSchema.optional(),
}

export const validateProjectOutputShape = z.union([
  z.object(validateProjectSuccessOutputShape),
  z.object(toolErrorOutputShape),
])

export type ValidateProjectInput = z.infer<z.ZodObject<typeof validateProjectInputShape>>
