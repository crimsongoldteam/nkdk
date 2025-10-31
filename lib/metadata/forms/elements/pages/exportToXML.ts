import { exportTableToXML } from "../table/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TPagesXML, TPages } from "./types"

export const exportPagesToXML = (data: TPages | undefined): TPagesXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    CurrentRowUse: data.currentRowUse,
    AssociatedTable: exportTableToXML(data.associatedTable),
    PagesRepresentation: data.pagesRepresentation,
    CurrentPagesState: data.currentPagesState,
  }
}