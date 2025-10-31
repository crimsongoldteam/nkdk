import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { TLabelDecorationXML, TLabelDecoration } from "./types"
import { ZElementType } from "../types"

export const importLabelDecorationFromXML = (xml: TLabelDecorationXML | undefined): TLabelDecoration | undefined => {
  if (!xml) return undefined

  const base = importFormDecorationFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.LabelDecoration,
    verticalAlign: xml.VerticalAlign,
    titleHeight: xml.TitleHeight,
    hyperlink: xml.Hyperlink,
    horizontalAlign: xml.HorizontalAlign,
    border: importBorderFromXML(xml.Border),
    borderColor: importColorFromXML(xml.BorderColor),
    backColor: importColorFromXML(xml.BackColor),
  }
}