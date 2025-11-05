import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZCheckBoxField = ZFormField.extend({
  backColor: ZColor.optional(),
  borderColor: ZColor.optional(),
  checkBoxType: SE.ZCheckBoxType.optional(),
  editFormat: ZI8nText.optional(),
  equalItemsWidth: z.boolean().optional(),
  font: ZFont.optional(),
  itemHeight: z.number().optional(),
  itemTitleHeight: z.number().optional(),
  itemWidth: z.number().optional(),
  textColor: ZColor.optional(),
  threeState: z.boolean().optional(),
})

export const ZCheckBoxFieldXML = ZFormFieldXML.extend({
  BackColor: ZColorXML.optional(),
  BorderColor: ZColorXML.optional(),
  CheckBoxType: SE.ZCheckBoxType.optional(),
  EditFormat: ZI8nTextXML.optional(),
  EqualItemsWidth: z.boolean().optional(),
  Font: ZFontXML.optional(),
  ItemHeight: z.number().optional(),
  ItemTitleHeight: z.number().optional(),
  ItemWidth: z.number().optional(),
  TextColor: ZColorXML.optional(),
  ThreeState: z.boolean().optional(),
})

export type TCheckBoxField = z.infer<typeof ZCheckBoxField>

export type TCheckBoxFieldXML = z.infer<typeof ZCheckBoxFieldXML>