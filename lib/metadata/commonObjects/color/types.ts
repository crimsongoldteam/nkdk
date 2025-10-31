import { z } from "zod"

export const ZColorXML = z.string()

export const ZColor = z.string()

export type TColor = z.infer<typeof ZColor>
export type TColorXML = z.infer<typeof ZColorXML>
