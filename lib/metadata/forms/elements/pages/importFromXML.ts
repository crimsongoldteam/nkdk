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
    currentRowUse: xml.CurrentRowUse,
    associatedTable: importTableFromXML(xml.AssociatedTable),
    pagesRepresentation: xml.PagesRepresentation,
    currentPagesState: xml.CurrentPagesState,
  }
}

registerImport(ZElementType.enum.Pages, importPagesFromXML)