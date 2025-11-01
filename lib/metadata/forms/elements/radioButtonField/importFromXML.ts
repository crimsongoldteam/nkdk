import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importChoiceListFromXML } from "~/lib/metadata/commonObjects/choiceList/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TRadioButtonFieldXML, TRadioButtonField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importRadioButtonFieldFromXML = (xml: TRadioButtonFieldXML | undefined): TRadioButtonField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.RadioButtonField,
    backColor: importColorFromXML(xml.BackColor),
    borderColor: importColorFromXML(xml.BorderColor),
    choiceList: importChoiceListFromXML(xml.ChoiceList),
    columnsCount: xml.ColumnsCount,
    equalColumnsWidth: xml.EqualColumnsWidth,
    font: importFontFromXML(xml.Font),
    itemHeight: xml.ItemHeight,
    itemTitleHeight: xml.ItemTitleHeight,
    itemWidth: xml.ItemWidth,
    radioButtonType: xml.RadioButtonType,
    textColor: importColorFromXML(xml.TextColor),
  }
}

registerImport(ZElementType.enum.RadioButtonField, importRadioButtonFieldFromXML)