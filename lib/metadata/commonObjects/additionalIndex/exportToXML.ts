import { exportIndexFieldsToXML } from "~/lib/metadata/commonObjects/indexField/exportToXML"
import { exportTableToXML } from "~/lib/metadata/forms/elements/table/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportAdditionalIndexToXML = (data: AdditionalIndex | undefined): AdditionalIndexXML | undefined => {
  if (!data) return undefined

  return {
    AdditionalFields: exportIndexFieldsToXML(data.additionalFields),
    IndexedFields: exportIndexFieldsToXML(data.indexedFields),
    Name: data.name,
    Table: exportTableToXML(data.table),
  }
}

registerExport(FormElementType.AdditionalIndex, exportAdditionalIndexToXML)
