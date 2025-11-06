import { z } from "zod"

export const ZEventXML = z.object({
  _name: z.string(),
  "#text": z.string().optional(),
})

export const ZEventsXML = z.array(
  z.object({
    Event: ZEventXML,
  })
)

export type TEventsXML = z.infer<typeof ZEventsXML>

export const ZEvents = z.record(z.string(), z.string())

export type TEvents = z.infer<typeof ZEvents>
