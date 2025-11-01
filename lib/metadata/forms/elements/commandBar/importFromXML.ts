import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { TCommandBarXML, TCommandBar } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importCommandBarFromXML = (xml: TCommandBarXML | undefined): TCommandBar | undefined => {
  if (!xml) return undefined

  const base = importFormGroupFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.CommandBar,
    displayImportance: xml._DisplayImportance,
    horizontalAlign: xml.HorizontalAlign,
  }
}

registerImport(ZElementType.enum.CommandBar, importCommandBarFromXML)