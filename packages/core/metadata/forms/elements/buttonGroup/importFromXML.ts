import { ConfigurationContext } from "~/metadata/context/types"
import { importElementFromXML, registerMetadata } from "~/metadata/metadataFactory"
import { ElementXML, FormElementType, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { ButtonGroup } from "./types"

export function importButtonGroupFromXML<To extends ButtonGroup>(
  context: ConfigurationContext,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, FormElementType.ButtonGroup, xml)
}

registerMetadata("ImportFromXML", "ButtonGroup", importButtonGroupFromXML as ImportFromXMLFn)
