import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/font/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"
import { ZChoiceList, ZChoiceListXML } from "~/lib/metadata/choiceList/types"

export const ZRadioButtonField = ZFormField.extend({
  radioButtonType: SE.ZRadioButtonType.optional(),
  itemTitleHeight: z.number().optional(),
  itemHeight: z.number().optional(),
  columnsCount: z.number().optional(),
  equalColumnsWidth: z.boolean().optional(),
  choiceList: ZChoiceList.optional(),
  borderColor: ZColor.optional(),
  textColor: ZColor.optional(),
  backColor: ZColor.optional(),
  itemWidth: z.number().optional(),
  font: ZFont.optional(),
})

export const ZRadioButtonFieldXML = ZFormFieldXML.extend({
  RadioButtonType: SE.ZRadioButtonType.optional(),
  ItemTitleHeight: z.number().optional(),
  ItemHeight: z.number().optional(),
  ColumnsCount: z.number().optional(),
  EqualColumnsWidth: z.boolean().optional(),
  ChoiceList: ZChoiceListXML.optional(),
  BorderColor: ZColorXML.optional(),
  TextColor: ZColorXML.optional(),
  BackColor: ZColorXML.optional(),
  ItemWidth: z.number().optional(),
  Font: ZFontXML.optional(),
})

export type TRadioButtonField = z.infer<typeof ZRadioButtonField>

export type TRadioButtonFieldXML = z.infer<typeof ZRadioButtonFieldXML>