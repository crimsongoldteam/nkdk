import { exportTableToXML } from "../table/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TPagesXML, TPages } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER = ["Visible", "UserVisible", "Enabled", "ReadOnly", "EnableContentChange", "Title", "TitleTextColor", "TitleFont", "ToolTip", "ToolTipRepresentation", "Shortcut", "Width", "Height", "HorizontalStretch", "VerticalStretch", "GroupHorizontalAlign", "GroupVerticalAlign", "PagesRepresentation", "CurrentRowUse", "AssociatedTableElementId", "ExtendedTooltip", "Events", "ChildItems"]

export const exportPagesToXML = (data: TPages | undefined): TPagesXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TPagesXML>( {
    ...base,
    AssociatedTable: exportTableToXML(data.associatedTable),
    CurrentPagesState: data.currentPagesState,
    CurrentRowUse: data.currentRowUse,
    PagesRepresentation: data.pagesRepresentation,
  }, ORDER)
}

registerExport(ZElementType.enum.Pages, exportPagesToXML)