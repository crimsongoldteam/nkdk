import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"
import { failedObjectSchema } from "./importFromXml"

export const syncToXmlInputShape = {
  yamlDir: z.string().min(1),
  xmlDir: z.string().min(1),
  referenceDir: z.string().min(1).optional(),
  allowWrite: z.boolean().optional(),
  fullSync: z.boolean().optional(),
}

export const syncToXmlSuccessOutputShape = {
  ok: z.literal(true),
  result: z.unknown().optional(),
  succeeded: z.number().optional(),
  changedXmlFiles: z.array(z.object({
    path: z.string(),
    change: z.union([z.literal("added"), z.literal("changed"), z.literal("deleted")]),
  })).optional(),
  migrationsApplied: z.array(z.object({
    fileName: z.string(),
    from: z.string(),
    to: z.string(),
  })).optional(),
  failed: z.array(failedObjectSchema).optional(),
}

export const syncToXmlOutputShape = z.union([z.object(syncToXmlSuccessOutputShape), z.object(toolErrorOutputShape)])

export type SyncToXmlInput = z.infer<z.ZodObject<typeof syncToXmlInputShape>>
