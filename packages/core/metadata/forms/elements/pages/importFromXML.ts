import { ConfigurationContext } from "~/metadata/context/types"
import { Pages } from "~/metadata/forms/elements/pages/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importPagesFromXML<To extends Pages>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, "Page", xml)
}

registerMetadata("ImportFromXML", "Pages", importPagesFromXML as ImportFromXMLFn)
