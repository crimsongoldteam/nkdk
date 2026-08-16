import { Type, type Static } from "typebox"
import { toolErrorOutputSchema } from "./common"
import { diagnosticReportSchema, diagnosticSummarySchema } from "./diagnostics"

export const validateProjectInputShape = Type.Object({
  projectDir: Type.String({ minLength: 1 }),
}, { additionalProperties: false })

export const diagnosticSchema = Type.Object({
  filePath: Type.String(),
  severity: Type.Union([Type.Literal("error"), Type.Literal("warning")]),
  message: Type.String(),
  path: Type.Optional(Type.String()),
}, { additionalProperties: false })

export const validateProjectSuccessOutputShape = Type.Object({
  ok: Type.Literal(true),
  diagnostics: Type.Array(diagnosticSchema),
  summary: diagnosticSummarySchema,
  truncated: Type.Boolean(),
  report: Type.Optional(diagnosticReportSchema),
}, { additionalProperties: false })

export const validateProjectOutputShape = Type.Union([validateProjectSuccessOutputShape, toolErrorOutputSchema])

export type ValidateProjectInput = Static<typeof validateProjectInputShape>
