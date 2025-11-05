import { exportTableToXML } from "../table/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TPagesXML, TPages } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportPagesToXML = (data: TPages | undefined): TPagesXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AssociatedTable: exportTableToXML(data.associatedTable),
    CurrentPagesState: data.currentPagesState,
    CurrentRowUse: data.currentRowUse,
    PagesRepresentation: data.pagesRepresentation,
    Events: data.events ? {
       OnCurrentPageChange: data.events.onCurrentPageChange,
    } : undefined,
  }
}

registerExport(ZElementType.enum.Pages, exportPagesToXML)