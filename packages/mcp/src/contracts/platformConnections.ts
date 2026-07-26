import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"

export const closePlatformConnectionInputShape = {
  projectDir: z.string().min(1),
}

export const closeAllPlatformConnectionsInputShape = {}

export const closePlatformConnectionOutputShape = z.union([
  z.object({
    ok: z.literal(true),
    closed: z.boolean(),
    stoppedOwnedProcess: z.boolean(),
  }),
  z.object(toolErrorOutputShape),
])

export const closeAllPlatformConnectionsOutputShape = z.union([
  z.object({
    ok: z.literal(true),
    closedCount: z.number().int().nonnegative(),
    stoppedOwnedProcesses: z.number().int().nonnegative(),
  }),
  z.object(toolErrorOutputShape),
])

export type ClosePlatformConnectionInput = z.infer<
  z.ZodObject<typeof closePlatformConnectionInputShape>
>
