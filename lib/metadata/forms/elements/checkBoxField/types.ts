import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/font/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZCheckBoxField = ZFormField.extend({
  checkBoxType: SE.ZCheckBoxType.optional(),
  itemTitleHeight: z.number().optional(),
  itemHeight: z.number().optional(),
  equalItemsWidth: z.boolean().optional(),
  threeState: z.boolean().optional(),
  editFormat: z.boolean().optional(),
  borderColor: ZColor.optional(),
  textColor: ZColor.optional(),
  backColor: ZColor.optional(),
  itemWidth: z.number().optional(),
  font: ZFont.optional(),
})

export const ZCheckBoxFieldXML = ZFormFieldXML.extend({
  CheckBoxType: SE.ZCheckBoxType.optional(),
  ItemTitleHeight: z.number().optional(),
  ItemHeight: z.number().optional(),
  EqualItemsWidth: z.boolean().optional(),
  ThreeState: z.boolean().optional(),
  EditFormat: z.boolean().optional(),
  BorderColor: ZColorXML.optional(),
  TextColor: ZColorXML.optional(),
  BackColor: ZColorXML.optional(),
  ItemWidth: z.number().optional(),
  Font: ZFontXML.optional(),
})

export type TCheckBoxField = z.infer<typeof ZCheckBoxField>

export type TCheckBoxFieldXML = z.infer<typeof ZCheckBoxFieldXML>