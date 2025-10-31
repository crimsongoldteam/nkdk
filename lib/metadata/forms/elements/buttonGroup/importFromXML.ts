import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { TButtonGroupXML, TButtonGroup } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importButtonGroupFromXML = (xml: TButtonGroupXML | undefined): TButtonGroup | undefined => {
  if (!xml) return undefined

  const base = importFormGroupFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.ButtonGroup,
    representation: xml.Representation,
  }
}

registerImport(ZElementType.enum.ButtonGroup, importButtonGroupFromXML)