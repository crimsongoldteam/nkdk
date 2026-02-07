import { ConfigurationContext } from "~/metadata/context/types"
import { Table } from "~/metadata/forms/elements/table/types"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function exportTableToXML<From extends Table | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From
): ToXMLType<From> {
  return exportElementToXML(context, "Table", data) as ToXMLType<From>
}

registerMetadata("ExportToXML", "Table", exportTableToXML as ExportToXMLFn)
