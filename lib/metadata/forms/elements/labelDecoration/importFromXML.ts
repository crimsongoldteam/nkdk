import importColorFromXML from "~/lib/metadata/color/importFromXML"
import importBorderFromXML from "~/lib/metadata/forms/border/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TLabelDecorationXML, TLabelDecoration } from "./types"


export const importLabelDecorationFromXML = (xml: TLabelDecorationXML | undefined): TLabelDecoration | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     verticalAlign: xml.VerticalAlign,
     titleHeight: xml.TitleHeight,
     hyperlink: xml.Hyperlink,
     horizontalAlign: xml.HorizontalAlign,
     border: importBorderFromXML(xml.Border),
     borderColor: importColorFromXML(xml.BorderColor),
     backColor: importColorFromXML(xml.BackColor),
  }
}