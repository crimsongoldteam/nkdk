import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportCommandBarToXML } from "../commandBar/exportToXML"
import { exportBaseElementToXML } from "../baseElement/exportToXML"
import { TFormDecorationXML, TFormDecoration } from "./types"

export const exportFormDecorationToXML = (data: TFormDecoration | undefined): TFormDecorationXML | undefined => {
  if (!data) return undefined

  const base = exportBaseElementToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    DisplayImportance: data.displayImportance,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    Type: data.type,
    Visible: data.visible,
    Height: data.height,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    Enabled: data.enabled,
    Title: exportI8nTextToXML(data.title),
    ContextMenu: exportCommandBarToXML(data.contextMenu),
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    ToolTipRepresentation: data.toolTipRepresentation,
    ToolTip: exportI8nTextToXML(data.toolTip),
    SkipOnInput: data.skipOnInput,
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    ExtendedTooltip: exportFormDecorationToXML(data.extendedTooltip),
    Shortcut: data.shortcut,
    TextColor: exportColorToXML(data.textColor),
    Width: data.width,
    Font: exportFontToXML(data.font),
  }
}