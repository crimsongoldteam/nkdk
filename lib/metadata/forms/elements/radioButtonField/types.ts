import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"
import { ZChoiceList, ZChoiceListXML } from "~/lib/metadata/commonObjects/choiceList/types"

export const ZRadioButtonField = ZFormField.extend({
  backColor: ZColor.optional(),
  borderColor: ZColor.optional(),
  choiceList: ZChoiceList.optional(),
  columnsCount: z.number().optional(),
  equalColumnsWidth: z.boolean().optional(),
  font: ZFont.optional(),
  itemHeight: z.number().optional(),
  itemTitleHeight: z.number().optional(),
  itemWidth: z.number().optional(),
  radioButtonType: SE.ZRadioButtonType.optional(),
  textColor: ZColor.optional(),
})

export const ZRadioButtonFieldXML = ZFormFieldXML.extend({
  BackColor: ZColorXML.optional(),
  BorderColor: ZColorXML.optional(),
  ChoiceList: ZChoiceListXML.optional(),
  ColumnsCount: z.number().optional(),
  EqualColumnsWidth: z.boolean().optional(),
  Font: ZFontXML.optional(),
  ItemHeight: z.number().optional(),
  ItemTitleHeight: z.number().optional(),
  ItemWidth: z.number().optional(),
  RadioButtonType: SE.ZRadioButtonType.optional(),
  TextColor: ZColorXML.optional(),
})

export type TRadioButtonField = z.infer<typeof ZRadioButtonField>

export type TRadioButtonFieldXML = z.infer<typeof ZRadioButtonFieldXML>