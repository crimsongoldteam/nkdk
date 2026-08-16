import { Type, type Static } from "typebox"

export const diagnosticSummarySchema = Type.Object({
  errors: Type.Integer({ minimum: 0 }),
  warnings: Type.Integer({ minimum: 0 }),
  shown: Type.Integer({ minimum: 0, maximum: 100 }),
  omitted: Type.Integer({ minimum: 0 }),
}, { additionalProperties: false })

export const diagnosticReportSchema = Type.Object({
  uri: Type.String({ format: "uri" }),
  format: Type.Literal("application/x-ndjson"),
}, { additionalProperties: false })

export const metadataDiagnosticSchema = Type.Object({
  severity: Type.Union([Type.Literal("error"), Type.Literal("warning")]),
  message: Type.String(),
  code: Type.Optional(Type.String()),
  filePath: Type.Optional(Type.String()),
  path: Type.Optional(Type.String()),
  kind: Type.Optional(Type.String()),
  name: Type.Optional(Type.String()),
  targetProjectPath: Type.Optional(Type.String()),
}, { additionalProperties: false })

export const diagnosticOutputShape = {
  diagnostics: Type.Array(metadataDiagnosticSchema),
  summary: diagnosticSummarySchema,
  truncated: Type.Boolean(),
  report: Type.Optional(diagnosticReportSchema),
}

export type DiagnosticSummary = Static<typeof diagnosticSummarySchema>
export type DiagnosticReportReference = Static<typeof diagnosticReportSchema>
