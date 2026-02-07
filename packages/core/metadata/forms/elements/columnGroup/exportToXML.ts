import { ConfigurationContext } from "~/metadata/context/types"
import { ColumnGroup } from "~/metadata/forms/elements/columnGroup/types"
import { exportElementToXML, registerMetadata } from "~/metadata/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"

export function exportColumnGroupToXML<From extends ColumnGroup | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  return exportElementToXML(context, "ColumnGroup", data) as ToXMLType<From>
}

registerMetadata("ExportToXML", "ColumnGroup", exportColumnGroupToXML as ExportToXMLFn)
