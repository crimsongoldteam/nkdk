import { Type } from "typebox"
import { z } from "zod/v4"

export const ProjectCacheInput = Type.Object({
  projectDir: Type.String({ minLength: 1 }),
  allowWrite: Type.Literal(true),
}, { additionalProperties: false })

export type ProjectCacheInput = Type.Static<typeof ProjectCacheInput>

export const projectCacheInputSchema = z.strictObject({
  projectDir: z.string().min(1),
  allowWrite: z.literal(true),
})
