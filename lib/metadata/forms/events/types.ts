import { z } from "zod"

export const ZEventXML = z.object({
  _name: z.string(),
  "#text": z.string().optional(),
})

export const ZEventsXML = z.object({
  Event: z.union([ZEventXML, z.array(ZEventXML)]).optional(),
})

export const ZEvents = z.record(z.string(), z.string())

export type TEventXML = z.infer<typeof ZEventXML>
export type TEventsXML = z.infer<typeof ZEventsXML>
export type TEvents = z.infer<typeof ZEvents>

