import { registerExport } from "~/lib/xml/export/exporterFactory"
import { exportTableToXML } from "../table/exportToXML"
import { FormElementType } from "../types"

export const exportAdditionalIndexToXML = (data: AdditionalIndex | undefined): AdditionalIndexXML | undefined => {
  if (!data) return undefined

  return {
    AdditionalFields: data.additionalFields,
    IndexedFields: data.indexedFields,
    Table: exportTableToXML(data.table),
  }
}

registerExport(FormElementType.AdditionalIndex, exportAdditionalIndexToXML)
