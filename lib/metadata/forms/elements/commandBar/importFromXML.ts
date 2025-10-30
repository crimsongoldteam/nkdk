import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TCommandBarXML, TCommandBar } from "./types"


export const importCommandBarFromXML = (xml: TCommandBarXML | undefined): TCommandBar | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     displayImportance: xml.DisplayImportance,
     horizontalAlign: xml.HorizontalAlign,
  }
}