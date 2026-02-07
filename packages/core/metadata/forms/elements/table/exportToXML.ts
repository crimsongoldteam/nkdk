import { ConfigurationContext } from "~/metadata/context/types"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { Table } from "./types"

export const exportTableToXML = (context: ConfigurationContext, data?: Table) => {
  return exportElementToXML(context, "Table", data)
}

registerMetadata("ExportToXML", "Table", exportTableToXML)
