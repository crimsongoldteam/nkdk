import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TCommandBarXML, TCommandBar } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER = ["Visible", "UserVisible", "Enabled", "ReadOnly", "EnableContentChange", "Title", "TitleTextColor", "TitleFont", "ToolTip", "ToolTipRepresentation", "Width", "Height", "HorizontalStretch", "VerticalStretch", "GroupHorizontalAlign", "GroupVerticalAlign", "HorizontalLocation", "CommandSource", "ExtendedTooltip"]

export const exportCommandBarToXML = (data: TCommandBar | undefined): TCommandBarXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TCommandBarXML>( {
    ...base,
    DisplayImportance: data.displayImportance,
    HorizontalAlign: data.horizontalAlign,
  }, ORDER)
}

registerExport(ZElementType.enum.CommandBar, exportCommandBarToXML)