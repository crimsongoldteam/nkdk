import { importFormTableFromXML } from "../formTable/importFromXML"
import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { TPagesXML, TPages } from "./types"
import { ZElementType } from "../types"

export const importPagesFromXML = (xml: TPagesXML | undefined): TPages | undefined => {
  if (!xml) return undefined

  const base = importFormGroupFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.Pages,
    currentRowUse: xml.CurrentRowUse,
    associatedTable: importFormTableFromXML(xml.AssociatedTable),
    pagesRepresentation: xml.PagesRepresentation,
    currentPagesState: xml.CurrentPagesState,
  }
}