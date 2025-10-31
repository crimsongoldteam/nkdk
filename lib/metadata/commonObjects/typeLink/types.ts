import { z } from "zod"

export const ZTypeLinkXML = z.object({
  "xr:DataPath": z.string(),
  "xr:LinkItem": z.union([z.string(), z.number()]),
})

export const ZTypeLink = z.object({
  dataPath: z.string(),
  linkItem: z.union([z.string(), z.number()]),
})

export type TTypeLinkXML = z.infer<typeof ZTypeLinkXML>
export type TTypeLink = z.infer<typeof ZTypeLink>
