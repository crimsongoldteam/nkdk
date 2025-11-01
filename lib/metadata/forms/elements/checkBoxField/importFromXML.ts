import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TCheckBoxFieldXML, TCheckBoxField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importCheckBoxFieldFromXML = (xml: TCheckBoxFieldXML | undefined): TCheckBoxField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.CheckBoxField,
    backColor: importColorFromXML(xml.BackColor),
    borderColor: importColorFromXML(xml.BorderColor),
    checkBoxType: xml.CheckBoxType,
    editFormat: xml.EditFormat,
    equalItemsWidth: xml.EqualItemsWidth,
    font: importFontFromXML(xml.Font),
    itemHeight: xml.ItemHeight,
    itemTitleHeight: xml.ItemTitleHeight,
    itemWidth: xml.ItemWidth,
    textColor: importColorFromXML(xml.TextColor),
    threeState: xml.ThreeState,
  }
}

registerImport(ZElementType.enum.CheckBoxField, importCheckBoxFieldFromXML)