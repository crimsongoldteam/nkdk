import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TPagesXML, TPages } from "./types"


export const importPagesFromXML = (xml: TPagesXML | undefined): TPages | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     currentRowUse: xml.CurrentRowUse,
     associatedTable: xml.AssociatedTable,
     pagesRepresentation: xml.PagesRepresentation,
     currentPage: xml.CurrentPage,
     currentPagesState: xml.CurrentPagesState,
  }
}