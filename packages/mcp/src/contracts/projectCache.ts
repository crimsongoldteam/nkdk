import { Type } from "typebox"
import { z } from "zod/v4"
import { diagnosticOutputShape } from "./diagnostics"

export const ProjectCacheInput = Type.Object({
  projectDir: Type.String({ minLength: 1 }),
  allowWrite: Type.Literal(true),
}, { additionalProperties: false })

export type ProjectCacheInput = Type.Static<typeof ProjectCacheInput>

export const projectCacheInputSchema = z.strictObject({
  projectDir: z.string().min(1),
  allowWrite: z.literal(true),
})

export const rebuildProjectCacheOutputSchema = z.looseObject({
  ok: z.literal(true),
  ...diagnosticOutputShape,
  stats: z.object({
    hashedFiles: z.number().int().nonnegative(),
    parsedYamlFiles: z.number().int().nonnegative(),
    changedFiles: z.number().int().nonnegative(),
    deletedFiles: z.number().int().nonnegative(),
  }),
})
