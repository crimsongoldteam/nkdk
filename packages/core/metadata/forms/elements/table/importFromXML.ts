import { ConfigurationContext } from "~/metadata/context/types"
import { Table } from "~/metadata/forms/elements/table/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importTableFromXML<To extends Table | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: ToXMLType<To> | undefined
): To {
  return importElementFromXML(context, "Table", xml) as To
}

registerMetadata("ImportFromXML", "Table", importTableFromXML as ImportFromXMLFn)
