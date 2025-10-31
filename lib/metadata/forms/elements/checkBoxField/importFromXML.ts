import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TCheckBoxFieldXML, TCheckBoxField } from "./types"
import { ZElementType } from "../types"

export const importCheckBoxFieldFromXML = (xml: TCheckBoxFieldXML | undefined): TCheckBoxField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.CheckBoxField,
    checkBoxType: xml.CheckBoxType,
    itemTitleHeight: xml.ItemTitleHeight,
    itemHeight: xml.ItemHeight,
    equalItemsWidth: xml.EqualItemsWidth,
    threeState: xml.ThreeState,
    editFormat: xml.EditFormat,
    borderColor: importColorFromXML(xml.BorderColor),
    textColor: importColorFromXML(xml.TextColor),
    backColor: importColorFromXML(xml.BackColor),
    itemWidth: xml.ItemWidth,
    font: importFontFromXML(xml.Font),
  }
}