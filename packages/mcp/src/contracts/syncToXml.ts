import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"
import { failedObjectSchema } from "./importFromXml"

export const syncToXmlInputShape = {
  yamlDir: z.string().min(1),
  xmlDir: z.string().min(1),
  referenceDir: z.string().min(1).optional(),
  allowWrite: z.boolean().optional(),
}

export const syncToXmlSuccessOutputShape = {
  ok: z.literal(true),
  succeeded: z.number(),
  failed: z.array(failedObjectSchema),
}

export const syncToXmlOutputShape = z.union([z.object(syncToXmlSuccessOutputShape), z.object(toolErrorOutputShape)])

export type SyncToXmlInput = z.infer<z.ZodObject<typeof syncToXmlInputShape>>
