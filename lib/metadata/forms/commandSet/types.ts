import z from "zod"

export const ZCommandSet = z.array(z.string())

export const ZExcludedCommandXML = z.object({
  ExcludedCommand: z.string(),
})
export const ZCommandSetXML = z.array(ZExcludedCommandXML)

export type TCommandSet = z.infer<typeof ZCommandSet>
export type TCommandSetXML = z.infer<typeof ZCommandSetXML>
