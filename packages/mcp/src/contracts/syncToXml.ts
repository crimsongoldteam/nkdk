import { Type, type Static } from "typebox"
import { toolErrorOutputSchema } from "./common"
import { diagnosticOutputShape } from "./diagnostics"

export const syncToXmlInputShape = Type.Object({
  projectDir: Type.String({ minLength: 1 }),
  componentPath: Type.Optional(Type.String({ minLength: 1 })),
  xmlDir: Type.String({ minLength: 1 }),
  concurrency: Type.Optional(Type.Integer({ minimum: 1 })),
  allowWrite: Type.Optional(Type.Boolean()),
  ignoreValidationErrors: Type.Optional(Type.Boolean()),
}, { additionalProperties: false })

export const syncToXmlSuccessOutputShape = Type.Object({
  ok: Type.Literal(true),
  ...diagnosticOutputShape,
  result: Type.Optional(Type.Unknown()),
  succeeded: Type.Optional(Type.Number()),
  configurationIndexPath: Type.Optional(Type.String()),
  warnings: Type.Optional(Type.Array(Type.Object({
    severity: Type.Literal("warning"),
    code: Type.String(),
    message: Type.String(),
  }, { additionalProperties: false }))),
  failed: Type.Optional(Type.Array(Type.Object({
    severity: Type.Literal("error"),
    code: Type.String(),
    message: Type.String(),
  }, { additionalProperties: false }))),
}, { additionalProperties: false })

export const syncToXmlOutputShape = Type.Union([syncToXmlSuccessOutputShape, toolErrorOutputSchema])

export type SyncToXmlInput = Static<typeof syncToXmlInputShape>
