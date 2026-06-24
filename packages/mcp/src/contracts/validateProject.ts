import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"

export const validateProjectInputShape = {
  projectDir: z.string().min(1),
  filePath: z.string().min(1).optional(),
}

export const diagnosticSchema = z.object({
  filePath: z.string(),
  line: z.number(),
  col: z.number(),
  severity: z.enum(["error", "warning"]),
  message: z.string(),
})

export const validateProjectSuccessOutputShape = {
  ok: z.literal(true),
  diagnostics: z.array(diagnosticSchema),
  summary: z.object({
    errors: z.number(),
    warnings: z.number(),
  }),
}

export const validateProjectOutputShape = z.union([
  z.object(validateProjectSuccessOutputShape),
  z.object(toolErrorOutputShape),
])

export type ValidateProjectInput = z.infer<z.ZodObject<typeof validateProjectInputShape>>
