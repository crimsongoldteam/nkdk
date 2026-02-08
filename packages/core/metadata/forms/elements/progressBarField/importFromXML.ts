import { ConfigurationContext } from "~/metadata/context/types"
import { ProgressBarField } from "~/metadata/forms/elements/progressBarField/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importProgressBarFieldFromXML<To extends ProgressBarField>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, "ProgressBarField", xml)
}

registerMetadata("ImportFromXML", "ProgressBarField", importProgressBarFieldFromXML as ImportFromXMLFn)
