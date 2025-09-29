import * as z from "zod"
import { ZI8nText } from "~/lib/metadata/types"
import { ZI8nTextXML } from "~/lib/xml/types"

export const ZClientApplicationFormXML = z.object({
  Title: ZI8nTextXML,
})

export const ZClientApplicationForm = z.object({
  title: ZI8nText.optional(),

  items: z.array(z.any()),
})

export type TClientApplicationForm = z.infer<typeof ZClientApplicationForm>
