import { Type, type Static } from "typebox"
import { toolErrorOutputSchema } from "./common"
import { diagnosticOutputShape } from "./diagnostics"

export const ProjectCacheInput = Type.Object({
  projectDir: Type.String({ minLength: 1 }),
  allowWrite: Type.Literal(true),
}, { additionalProperties: false })

export type ProjectCacheInput = Static<typeof ProjectCacheInput>

export const projectCacheInputSchema = ProjectCacheInput

export const resetProjectCacheOutputSchema = Type.Union([
  Type.Object({ ok: Type.Literal(true), reset: Type.Literal(true) }, { additionalProperties: false }),
  toolErrorOutputSchema,
])

const rebuildProjectCacheSuccessOutputSchema = Type.Object({
  ok: Type.Literal(true),
  ...diagnosticOutputShape,
  stats: Type.Object({
    hashedFiles: Type.Integer({ minimum: 0 }),
    parsedYamlFiles: Type.Integer({ minimum: 0 }),
    changedFiles: Type.Integer({ minimum: 0 }),
    deletedFiles: Type.Integer({ minimum: 0 }),
  }, { additionalProperties: false }),
}, { additionalProperties: true })

export const rebuildProjectCacheOutputSchema = Type.Union([
  rebuildProjectCacheSuccessOutputSchema,
  toolErrorOutputSchema,
])
