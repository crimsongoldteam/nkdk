import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"

export const initSyncStateInputShape = {
  yamlDir: z.string().min(1),
  xmlDir: z.string().min(1),
  allowWrite: z.boolean().optional(),
}

export const initSyncStateSuccessOutputShape = {
  ok: z.literal(true),
  stateFile: z.literal(".nkdk-sync.yaml"),
}

export const initSyncStateOutputShape = z.union([
  z.object(initSyncStateSuccessOutputShape),
  z.object(toolErrorOutputShape),
])

export type InitSyncStateInput = z.infer<z.ZodObject<typeof initSyncStateInputShape>>
