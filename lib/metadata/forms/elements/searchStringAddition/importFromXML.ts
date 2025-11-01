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
    backColor: importColorFromXML(xml.BackColor),
    borderColor: importColorFromXML(xml.BorderColor),
    font: importFontFromXML(xml.Font),
    horizontalStretch: xml.HorizontalStretch,
    textColor: importColorFromXML(xml.TextColor),
    width: xml.Width,
  }
}

registerImport(ZElementType.enum.SearchStringAddition, importSearchStringAdditionFromXML)