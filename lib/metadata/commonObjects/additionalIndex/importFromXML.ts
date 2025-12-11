import { importTableFromXML } from "../table/importFromXML"
import { importChoiceParameterLinksFromXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { TObjectXML, TObject } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importObjectFromXML = (xml: TObjectXML | undefined): TObject | undefined => {
  if (!xml) return undefined
   
  return {
    id: xml._id,
    name: xml._name,
    elementType: ZElementType.enum.Object,
    additionalFields: importChoiceParameterLinksFromXML(xml.AdditionalFields),
    indexedFields: importChoiceParameterLinksFromXML(xml.IndexedFields),
    table: importTableFromXML(xml.Table),
    userVisible: importUserVisibleFromXML(xml.UserVisible),
  }
}

registerImport(ZElementType.enum.Object, importObjectFromXML)