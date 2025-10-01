import * as z from "zod"
import { ZI8nText } from "~/lib/metadata/types"
import { ZI8nTextXML } from "~/lib/xml/types"
import { ZInputField, ZInputFieldXML } from "../inputField/types"

export const ZClientApplicationFormXML = z.object({
  Title: ZI8nTextXML.optional(),
  ChildItems: z.array(ZInputFieldXML),
})

export const ZClientApplicationForm = z.object({
  title: ZI8nText.optional(),

  items: z.array(ZInputField),
})

export type TClientApplicationForm = z.infer<typeof ZClientApplicationForm>
export type TClientApplicationFormXML = z.infer<typeof ZClientApplicationFormXML>
