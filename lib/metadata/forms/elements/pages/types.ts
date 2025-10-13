import * as z from "zod"
import { ZI8nText } from "~/lib/metadata/i8nText/types"
import { ZI8nTextXML } from "~/lib/metadata/i8nText/types"
import { ZNamedElement } from "../element/types"
import { ZPage } from "../page/types"

export const ZPagesXML = z.object({
  Pages: z.object({
    _name: z.string(),
    _id: z.string(),
    Title: ZI8nTextXML.optional(),
    ChildItems: z.array(ZPage).optional(),
  }),
})

export const ZPages = ZNamedElement.extend({
  title: ZI8nText.optional(),
  childItems: z.array(ZPage),
})

export type TPages = z.infer<typeof ZPages>
export type TPagesXML = z.infer<typeof ZPagesXML>
