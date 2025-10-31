import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { exportBaseElementToXML } from "../baseElement/exportToXML"
import { TFormGroupXML, TFormGroup } from "./types"

export const exportFormGroupToXML = (data: TFormGroup | undefined): TFormGroupXML | undefined => {
  if (!data) return undefined

  const base = exportBaseElementToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    Type: data.type,
    Visible: data.visible,
    Height: data.height,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    Enabled: data.enabled,
    Title: exportI8nTextToXML(data.title),
    ToolTipRepresentation: data.toolTipRepresentation,
    ToolTip: exportI8nTextToXML(data.toolTip),
    ChildItems: exportChildItemsToXML(data.childItems),
    EnableContentChange: data.enableContentChange,
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    ExtendedTooltip: exportFormDecorationToXML(data.extendedTooltip),
    Shortcut: data.shortcut,
    ReadOnly: data.readOnly,
    TitleTextColor: exportColorToXML(data.titleTextColor),
    Width: data.width,
    TitleFont: exportFontToXML(data.titleFont),
  }
}