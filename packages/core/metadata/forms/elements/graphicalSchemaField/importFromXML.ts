import { ConfigurationContext } from "~/metadata/context/types"
import { GraphicalSchemaField } from "~/metadata/forms/elements/graphicalSchemaField/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importGraphicalSchemaFieldFromXML<To extends GraphicalSchemaField>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, "GraphicalSchemaField", xml)
}

registerMetadata("ImportFromXML", "GraphicalSchemaField", importGraphicalSchemaFieldFromXML as ImportFromXMLFn)
