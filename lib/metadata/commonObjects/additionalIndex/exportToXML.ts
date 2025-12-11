import { exportTableToXML } from "../table/exportToXML"
import { exportChoiceParameterLinksToXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { TObjectXML, TObject } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportObjectToXML = (data: TObject | undefined): TObjectXML | undefined => {
  if (!data) return undefined
 
  return {
   _id: data.id ?? "",
   _name: data.name ?? "",
    AdditionalFields: exportChoiceParameterLinksToXML(data.additionalFields),
    IndexedFields: exportChoiceParameterLinksToXML(data.indexedFields),
    Table: exportTableToXML(data.table),
    UserVisible: exportUserVisibleToXML(data.userVisible),
  }
}

registerExport(ZElementType.enum.Object, exportObjectToXML)