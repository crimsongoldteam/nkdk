import z from "zod"

export const ZCommandSet = z.array(z.string())

export const ZCommandSetXML = z.object({
  ExcludedCommand: z.union([z.string(), z.array(z.string())]).optional(),
})

export type TCommandSet = z.infer<typeof ZCommandSet>
export type TCommandSetXML = z.infer<typeof ZCommandSetXML>
