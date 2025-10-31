import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importFormItemAdditionFromXML } from "../formItemAddition/importFromXML"
import { TSearchStringAdditionXML, TSearchStringAddition } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importSearchStringAdditionFromXML = (xml: TSearchStringAdditionXML | undefined): TSearchStringAddition | undefined => {
  if (!xml) return undefined

  const base = importFormItemAdditionFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.SearchStringAddition,
    horizontalStretch: xml.HorizontalStretch,
    borderColor: importColorFromXML(xml.BorderColor),
    textColor: importColorFromXML(xml.TextColor),
    backColor: importColorFromXML(xml.BackColor),
    width: xml.Width,
    font: importFontFromXML(xml.Font),
  }
}

registerImport(ZElementType.enum.SearchStringAddition, importSearchStringAdditionFromXML)