import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"

export const syncToXmlInputShape = {
  yamlDir: z.string().min(1),
  xmlDir: z.string().min(1),
  baseId: z.string().min(1).optional(),
  concurrency: z.number().int().positive().optional(),
  allowWrite: z.boolean().optional(),
}

export const syncToXmlSuccessOutputShape = {
  ok: z.literal(true),
  result: z.unknown().optional(),
  succeeded: z.number().optional(),
  configurationIndexPath: z.string().optional(),
  warnings: z.array(z.object({
    severity: z.literal("warning"),
    code: z.string(),
    message: z.string(),
  })).optional(),
  failed: z.array(z.object({
    severity: z.literal("error"),
    code: z.string(),
    message: z.string(),
  })).optional(),
}

export const syncToXmlOutputShape = z.union([z.object(syncToXmlSuccessOutputShape), z.object(toolErrorOutputShape)])

export type SyncToXmlInput = z.infer<z.ZodObject<typeof syncToXmlInputShape>>
