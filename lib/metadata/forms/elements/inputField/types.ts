import * as z from "zod"
import { ZI8nText } from "~/lib/metadata/types"
import { ZI8nTextXML } from "~/lib/xml/types"

export const ZInputFieldXML = z.object({
  _name: z.string(),
  Title: ZI8nTextXML,
})

export const ZInputField = z.object({
  name: z.string().optional(),
  title: ZI8nText.optional(),

  isMultiline: z.boolean().optional(),
  height: z.number().min(0).optional(),

  choiceButton: z.boolean().optional(),
  dropListButton: z.boolean().optional(),
  clearButton: z.boolean().optional(),
  openButton: z.boolean().optional(),
  spinButton: z.boolean().optional(),

  value: z.string().optional(),
})

export type TInputField = z.infer<typeof ZInputField>
