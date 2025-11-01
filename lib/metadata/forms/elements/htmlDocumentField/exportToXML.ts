import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { THTMLDocumentFieldXML, THTMLDocumentField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER = ["DataPath", "Visible", "UserVisible", "Enabled", "ReadOnly", "SkipOnInput", "Title", "TitleTextColor", "TitleFont", "TitleLocation", "TitleHeight", "ToolTip", "ToolTipRepresentation", "WarningOnEditRepresentation", "WarningOnEdit", "Shortcut", "HorizontalAlign", "GroupHorizontalAlign", "GroupVerticalAlign", "OnMainServerUnavalableBehavior", "Width", "ContextMenu", "ExtendedTooltip", "Events"]

export const exportHTMLDocumentFieldToXML = (data: THTMLDocumentField | undefined): THTMLDocumentFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<THTMLDocumentFieldXML>( {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BorderColor: exportColorToXML(data.borderColor),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Output: data.output,
    UserAgentInformation: data.userAgentInformation,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
  }, ORDER)
}

registerExport(ZElementType.enum.HTMLDocumentField, exportHTMLDocumentFieldToXML)