import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"

export const failedObjectSchema = z.object({
  kind: z.string(),
  name: z.string(),
  parent: z.string().optional(),
  message: z.string(),
})

export const importFromXmlInputShape = {
  xmlDir: z.string().min(1),
  yamlDir: z.string().min(1),
  allowWrite: z.boolean().optional(),
}

export const importFromXmlSuccessOutputShape = {
  ok: z.literal(true),
  succeeded: z.number(),
  failed: z.array(failedObjectSchema),
}

export const importFromXmlOutputShape = z.union([
  z.object(importFromXmlSuccessOutputShape),
  z.object(toolErrorOutputShape),
])

export type ImportFromXmlInput = z.infer<z.ZodObject<typeof importFromXmlInputShape>>
