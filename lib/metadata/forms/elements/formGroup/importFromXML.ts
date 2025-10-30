import importColorFromXML from "~/lib/metadata/color/importFromXML"
import importFontFromXML from "~/lib/metadata/font/importFromXML"
import importI8nTextFromXML from "~/lib/metadata/i8nText/importI8nTextFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { TFormGroupXML, TFormGroup } from "./types"


export const importFormGroupFromXML = (xml: TFormGroupXML | undefined): TFormGroup | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     verticalAlignInGroup: xml.VerticalAlignInGroup,
     type: xml.Type,
     visible: xml.Visible,
     height: xml.Height,
     horizontalAlignInGroup: xml.HorizontalAlignInGroup,
     enabled: xml.Enabled,
     title: importI8nTextFromXML(xml.Title),
     toolTipRepresentation: xml.ToolTipRepresentation,
     toolTip: importI8nTextFromXML(xml.ToolTip),
     childItems: xml.ChildItems,
     enableContentChange: xml.EnableContentChange,
     verticalStretch: xml.VerticalStretch,
     horizontalStretch: xml.HorizontalStretch,
     extendedTooltip: importFormDecorationFromXML(xml.ExtendedTooltip),
     shortcut: xml.Shortcut,
     readOnly: xml.ReadOnly,
     titleTextColor: importColorFromXML(xml.TitleTextColor),
     width: xml.Width,
     titleFont: importFontFromXML(xml.TitleFont),
  }
}