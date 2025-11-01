import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importFormItemAdditionFromXML } from "../formItemAddition/importFromXML"
import { TViewStatusAdditionXML, TViewStatusAddition } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importViewStatusAdditionFromXML = (xml: TViewStatusAdditionXML | undefined): TViewStatusAddition | undefined => {
  if (!xml) return undefined

  const base = importFormItemAdditionFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.ViewStatusAddition,
    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(xml.BackColor),
    border: importBorderFromXML(xml.Border),
    borderColor: importColorFromXML(xml.BorderColor),
    buttonsBackColor: importColorFromXML(xml.ButtonsBackColor),
    font: importFontFromXML(xml.Font),
    horizontalAlign: xml.HorizontalAlign,
    horizontalStretch: xml.HorizontalStretch,
    maxWidth: xml.MaxWidth,
    textColor: importColorFromXML(xml.TextColor),
    titleFont: importFontFromXML(xml.TitleFont),
    titleTextColor: importColorFromXML(xml.TitleTextColor),
    width: xml.Width,
  }
}

registerImport(ZElementType.enum.ViewStatusAddition, importViewStatusAdditionFromXML)