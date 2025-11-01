import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TTextDocumentFieldXML, TTextDocumentField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER = ["DataPath", "Visible", "UserVisible", "Enabled", "ReadOnly", "SkipOnInput", "Title", "TitleTextColor", "TitleFont", "TitleLocation", "TitleHeight", "ToolTip", "ToolTipRepresentation", "WarningOnEditRepresentation", "WarningOnEdit", "Shortcut", "HorizontalAlign", "GroupHorizontalAlign", "GroupVerticalAlign", "OnMainServerUnavalableBehavior", "Width", "AutoMaxWidth", "MaxWidth", "AutoMaxHeight", "HorizontalStretch", "VerticalStretch", "TextColor", "BackColor", "Font", "ContextMenu", "ExtendedTooltip", "Events"]

export const exportTextDocumentFieldToXML = (data: TTextDocumentField | undefined): TTextDocumentFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TTextDocumentFieldXML>( {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(data.backColor),
    BorderColor: exportColorToXML(data.borderColor),
    Font: exportFontToXML(data.font),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Output: data.output,
    SelectedText: data.selectedText,
    TextColor: exportColorToXML(data.textColor),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
  }, ORDER)
}

registerExport(ZElementType.enum.TextDocumentField, exportTextDocumentFieldToXML)