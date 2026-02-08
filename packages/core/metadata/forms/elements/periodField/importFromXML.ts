import { ConfigurationContext } from "~/metadata/context/types"
import { PeriodField } from "~/metadata/forms/elements/periodField/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importPeriodFieldFromXML<To extends PeriodField>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, "PeriodField", xml)
}

registerMetadata("ImportFromXML", "PeriodField", importPeriodFieldFromXML as ImportFromXMLFn)
