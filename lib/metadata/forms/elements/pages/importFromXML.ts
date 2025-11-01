import { importTableFromXML } from "../table/importFromXML"
import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { TPagesXML, TPages } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importPagesFromXML = (xml: TPagesXML | undefined): TPages | undefined => {
  if (!xml) return undefined

  const base = importFormGroupFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.Pages,
    associatedTable: importTableFromXML(xml.AssociatedTable),
    currentPagesState: xml.CurrentPagesState,
    currentRowUse: xml.CurrentRowUse,
    pagesRepresentation: xml.PagesRepresentation,
  }
}

registerImport(ZElementType.enum.Pages, importPagesFromXML)