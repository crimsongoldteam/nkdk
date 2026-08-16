import { Type, type Static } from "typebox"
import { toolErrorOutputSchema } from "./common"
import { diagnosticOutputShape } from "./diagnostics"

export const failedObjectSchema = Type.Object({
  severity: Type.Literal("error"),
  code: Type.String(),
  message: Type.String(),
  targetProjectPath: Type.Optional(Type.String()),
}, { additionalProperties: false })

export const importWarningSchema = Type.Object({
  code: Type.String(),
  message: Type.String(),
  targetProjectPath: Type.Optional(Type.String()),
}, { additionalProperties: false })

export const importFromXmlInputShape = Type.Object({
  xmlDir: Type.String({ minLength: 1 }),
  projectDir: Type.String({ minLength: 1 }),
  componentPath: Type.Optional(Type.String({ minLength: 1 })),
  concurrency: Type.Optional(Type.Integer({ minimum: 1 })),
  allowWrite: Type.Optional(Type.Boolean()),
}, { additionalProperties: false })

export const importFromXmlSuccessOutputShape = Type.Object({
  ok: Type.Literal(true),
  ...diagnosticOutputShape,
  componentPath: Type.String(),
  succeeded: Type.Number(),
  failed: Type.Array(failedObjectSchema),
  warnings: Type.Array(importWarningSchema),
  configurationIndexPath: Type.Optional(Type.String()),
}, { additionalProperties: false })

export const importFromXmlOutputShape = Type.Union([importFromXmlSuccessOutputShape, toolErrorOutputSchema])

export type ImportFromXmlInput = Static<typeof importFromXmlInputShape>
