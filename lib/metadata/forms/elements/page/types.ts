import * as z from "zod"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/i8nText/types"
import { ZNamedElement } from "../baseElement/types"

export const ZPageXML = z.object({
  Page: z.object({
    _name: z.string(),
    _id: z.string(),
    Title: ZI8nTextXML.optional(),
    ChildItems: z.any().optional(),
  }),
})

export const ZPage = ZNamedElement.extend({
  title: ZI8nText.optional(),
  childItems: z.array(ZNamedElement),
})

export type TPage = z.infer<typeof ZPage>
export type TPageXML = z.infer<typeof ZPageXML>
