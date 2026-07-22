import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"

export const failedObjectSchema = z.object({
  kind: z.string(),
  name: z.string(),
  parent: z.string().optional(),
  message: z.string(),
})

export const importWarningSchema = z.object({
  code: z.string(),
  message: z.string(),
  targetProjectPath: z.string().optional(),
})

export const importFromXmlInputShape = {
  xmlDir: z.string().min(1),
  projectDir: z.string().min(1),
  componentPath: z.string().min(1).optional(),
  allowWrite: z.boolean().optional(),
}

export const importFromXmlSuccessOutputShape = {
  ok: z.literal(true),
  succeeded: z.number(),
  failed: z.array(failedObjectSchema),
  warnings: z.array(importWarningSchema),
  configurationIndexPath: z.string().optional(),
}

export const importFromXmlOutputShape = z.union([
  z.object(importFromXmlSuccessOutputShape),
  z.object(toolErrorOutputShape),
])

export type ImportFromXmlInput = z.infer<z.ZodObject<typeof importFromXmlInputShape>>
