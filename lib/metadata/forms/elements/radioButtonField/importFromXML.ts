import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importChoiceListFromXML } from "~/lib/metadata/commonObjects/choiceList/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TRadioButtonFieldXML, TRadioButtonField } from "./types"

export const importRadioButtonFieldFromXML = (xml: TRadioButtonFieldXML | undefined): TRadioButtonField | undefined => {
  if (!xml) return undefined 

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    radioButtonType: xml.RadioButtonType,
    itemTitleHeight: xml.ItemTitleHeight,
    itemHeight: xml.ItemHeight,
    columnsCount: xml.ColumnsCount,
    equalColumnsWidth: xml.EqualColumnsWidth,
    choiceList: importChoiceListFromXML(xml.ChoiceList),
    borderColor: importColorFromXML(xml.BorderColor),
    textColor: importColorFromXML(xml.TextColor),
    backColor: importColorFromXML(xml.BackColor),
    itemWidth: xml.ItemWidth,
    font: importFontFromXML(xml.Font),
  }
}