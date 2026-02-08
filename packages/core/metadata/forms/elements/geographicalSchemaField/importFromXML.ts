import { ConfigurationContext } from "~/metadata/context/types"
import { GeographicalSchemaField } from "~/metadata/forms/elements/geographicalSchemaField/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importGeographicalSchemaFieldFromXML<To extends GeographicalSchemaField>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, "GeographicalSchemaField", xml)
}

registerMetadata("ImportFromXML", "GeographicalSchemaField", importGeographicalSchemaFieldFromXML as ImportFromXMLFn)
