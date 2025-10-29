import * as z from "zod"
import { ZI8nText } from "~/lib/metadata/i8nText/types"
import { ZI8nTextXML } from "~/lib/metadata/i8nText/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"

export const ZInputFieldXML = ZBaseElementXML.extend({
  DataPath: z.string().optional(),
  Title: ZI8nTextXML.optional(),
})

export const ZInputField = ZBaseElement.extend({
  title: ZI8nText.optional(),

  autoCapitalizationOnTextInput: SE.ZAutoCapitalizationOnTextInput.optional(),

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
export type TInputFieldXML = z.infer<typeof ZInputFieldXML>
