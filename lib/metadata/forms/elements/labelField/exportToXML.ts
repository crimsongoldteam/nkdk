import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TLabelFieldXML, TLabelField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER = ["DataPath", "Visible", "UserVisible", "Enabled", "ReadOnly", "SkipOnInput", "Title", "TitleTextColor", "TitleFont", "TitleLocation", "TitleHeight", "ToolTip", "ToolTipRepresentation", "WarningOnEditRepresentation", "WarningOnEdit", "Shortcut", "HorizontalAlign", "GroupHorizontalAlign", "GroupVerticalAlign", "OnMainServerUnavalableBehavior", "Width", "Height", "HorizontalStretch", "VerticalStretch", "Hiperlink", "PasswordMode", "Border", "TextColor", "BackColor", "Font", "ContextMenu", "ExtendedTooltip", "Events"]

export const exportLabelFieldToXML = (data: TLabelField | undefined): TLabelFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TLabelFieldXML>( {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(data.backColor),
    Border: exportBorderToXML(data.border),
    BorderColor: exportColorToXML(data.borderColor),
    Font: exportFontToXML(data.font),
    Format: exportI8nTextToXML(data.format),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    Hyperlink: data.hyperlink,
    MarkNegatives: data.markNegatives,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    PasswordMode: data.passwordMode,
    TextColor: exportColorToXML(data.textColor),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
  }, ORDER)
}

registerExport(ZElementType.enum.LabelField, exportLabelFieldToXML)