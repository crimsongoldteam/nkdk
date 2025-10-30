import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TButtonGroupXML, TButtonGroup } from "./types"


export const importButtonGroupFromXML = (xml: TButtonGroupXML | undefined): TButtonGroup | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     representation: xml.Representation,
  }
}