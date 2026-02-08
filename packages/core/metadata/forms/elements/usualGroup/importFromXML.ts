import { ConfigurationContext } from "~/metadata/context/types"
import { UsualGroup } from "~/metadata/forms/elements/usualGroup/types"
import { importElementFromXML, registerMetadata } from "~/metadata/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"

export function importUsualGroupFromXML<To extends UsualGroup>(
  context: ConfigurationContext,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, "UsualGroup", xml)
}

registerMetadata("ImportFromXML", "UsualGroup", importUsualGroupFromXML as ImportFromXMLFn)
