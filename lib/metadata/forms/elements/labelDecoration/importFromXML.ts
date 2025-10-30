import importColorFromXML from "~/lib/metadata/color/importFromXML"
import importFontFromXML from "~/lib/metadata/font/importFromXML"
import importI8nTextFromXML from "~/lib/metadata/i8nText/importI8nTextFromXML"
import importTypeDescriptionFromXML from "~/lib/metadata/typeDescription/importFromXML"
import importPictureFromXML from "../../pictures/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TFormFieldXML, TFormField, TLabelDecoration, TLabelDecorationXML } from "./types"
import { ZElementType } from "~/lib/metadata/systemEnumerations/types"

export const importLabelDecorationFromXML = (xml: TLabelDecorationXML | undefined): TLabelDecoration | undefined => {
  if (!xml) return undefined
  return {
    ...importBaseElementFromXML(xml),
    verticalAlign: xml.VerticalAlign,
    titleHeight: xml.TitleHeight,
    hyperlink: xml.Hyperlink,
    horizontalAlign: xml.HorizontalAlign,
    border: xml.Border,
    borderColor: importColorFromXML(xml.BorderColor),
    backColor: importColorFromXML(xml.BackColor),
  }
}
