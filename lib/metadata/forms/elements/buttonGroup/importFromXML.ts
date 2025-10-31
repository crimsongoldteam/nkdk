import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { TButtonGroupXML, TButtonGroup } from "./types"

export const importButtonGroupFromXML = (xml: TButtonGroupXML | undefined): TButtonGroup | undefined => {
  if (!xml) return undefined 

  const base = importFormGroupFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    representation: xml.Representation,
  }
}