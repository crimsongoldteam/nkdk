import { ConfigurationContext } from "~/metadata/context/types"
import { Table } from "~/metadata/forms/elements/table/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"
import { exportElementToXML } from "~/metadata/metadataFactory"

export function exportTableToXML<From extends Table | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToXMLType<From> {
  return exportElementToXML(context, "Table", data) as ToXMLType<From>
}

registerMetadata("ExportToXML", "Table", exportTableToXML as ExportToXMLFn)
