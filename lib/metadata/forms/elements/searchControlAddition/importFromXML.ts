import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importFormItemAdditionFromXML } from "../formItemAddition/importFromXML"
import { TSearchControlAdditionXML, TSearchControlAddition } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importSearchControlAdditionFromXML = (xml: TSearchControlAdditionXML | undefined): TSearchControlAddition | undefined => {
  if (!xml) return undefined

  const base = importFormItemAdditionFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.SearchControlAddition,
    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(xml.BackColor),
    borderColor: importColorFromXML(xml.BorderColor),
    font: importFontFromXML(xml.Font),
    horizontalStretch: xml.HorizontalStretch,
    maxWidth: xml.MaxWidth,
    textColor: importColorFromXML(xml.TextColor),
    width: xml.Width,
  }
}

registerImport(ZElementType.enum.SearchControlAddition, importSearchControlAdditionFromXML)