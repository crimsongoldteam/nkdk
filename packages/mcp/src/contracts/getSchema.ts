import { Type, type Static } from "typebox"
import { toolErrorOutputSchema } from "./common"

export const getSchemaInputShape = Type.Object({
  projectDir: Type.String({ minLength: 1 }),
  componentPath: Type.Optional(Type.String({ minLength: 1 })),
  metadataRef: Type.Optional(Type.String({ minLength: 1 })),
  structurePath: Type.Optional(Type.String({ minLength: 1 })),
  format: Type.Optional(Type.Union([Type.Literal("summary"), Type.Literal("jsonSchema")])),
  mode: Type.Optional(Type.Union([Type.Literal("externalRefs"), Type.Literal("inline")])),
  keys: Type.Optional(Type.Union([Type.Literal(true), Type.String({ minLength: 1 })])),
  required: Type.Optional(Type.Boolean()),
  search: Type.Optional(Type.String()),
  exact: Type.Optional(Type.Boolean()),
}, { additionalProperties: false })

export const getSchemaResultSchema = Type.Union([
  Type.Object({ kind: Type.Literal("keys"), keys: Type.Array(Type.String()) }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal("summary"), summary: Type.Union([Type.Unknown(), Type.Null()]) }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal("jsonSchema"), schema: Type.Unknown() }, { additionalProperties: false }),
])

export const getSchemaSuccessOutputShape = Type.Object({
  ok: Type.Literal(true),
  target: Type.String(),
  format: Type.Union([Type.Literal("summary"), Type.Literal("jsonSchema")]),
  result: getSchemaResultSchema,
}, { additionalProperties: false })

export const getSchemaOutputShape = Type.Union([getSchemaSuccessOutputShape, toolErrorOutputSchema])

export type GetSchemaInput = Static<typeof getSchemaInputShape>
