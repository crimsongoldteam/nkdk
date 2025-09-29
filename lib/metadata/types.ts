import { z } from "zod"

export const ZI8nText = z.record(z.string(), z.string())

export type TI8nText = z.infer<typeof ZI8nText>
