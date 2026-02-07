import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToXMLFn } from "~/metadata/metadataFactory/types"
import { Table } from "~/metadata/forms/elements/table/types"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export function exportTableToXML(context: ConfigurationContext, data: Table | undefined) {
  return exportElementToXML(context, "Table", data)
}

registerMetadata("ExportToXML", "Table", exportTableToXML as ExportToXMLFn)
