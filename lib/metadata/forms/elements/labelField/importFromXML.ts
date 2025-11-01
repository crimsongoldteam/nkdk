import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TLabelFieldXML, TLabelField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importLabelFieldFromXML = (xml: TLabelFieldXML | undefined): TLabelField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.LabelField,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(xml.BackColor),
    border: importBorderFromXML(xml.Border),
    borderColor: importColorFromXML(xml.BorderColor),
    font: importFontFromXML(xml.Font),
    format: xml.Format,
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    hyperlink: xml.Hyperlink,
    markNegatives: xml.MarkNegatives,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    passwordMode: xml.PasswordMode,
    textColor: importColorFromXML(xml.TextColor),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
  }
}

registerImport(ZElementType.enum.LabelField, importLabelFieldFromXML)