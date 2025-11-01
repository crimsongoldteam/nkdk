import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { TLabelDecorationXML, TLabelDecoration } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importLabelDecorationFromXML = (xml: TLabelDecorationXML | undefined): TLabelDecoration | undefined => {
  if (!xml) return undefined

  const base = importFormDecorationFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.LabelDecoration,
    backColor: importColorFromXML(xml.BackColor),
    border: importBorderFromXML(xml.Border),
    borderColor: importColorFromXML(xml.BorderColor),
    horizontalAlign: xml.HorizontalAlign,
    hyperlink: xml.Hyperlink,
    titleHeight: xml.TitleHeight,
    verticalAlign: xml.VerticalAlign,
  }
}

registerImport(ZElementType.enum.LabelDecoration, importLabelDecorationFromXML)