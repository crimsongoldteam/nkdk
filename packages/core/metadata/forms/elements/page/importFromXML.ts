import { ConfigurationContext } from "~/metadata/context/types"
import { Page } from "~/metadata/forms/elements/page/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importPageFromXML<To extends Page>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, "Page", xml)
}

registerMetadata("ImportFromXML", "Page", importPageFromXML as ImportFromXMLFn)
