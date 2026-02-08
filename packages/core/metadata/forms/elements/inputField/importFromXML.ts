import { ConfigurationContext } from "~/metadata/context/types"
import { InputField } from "~/metadata/forms/elements/inputField/types"
import { importElementFromXML, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType, ImportFromXMLFn } from "~/metadata/metadataFactory/types"

export function importInputFieldFromXML<To extends InputField | undefined>(
  context: ConfigurationContext,
  xml: ElementXML | undefined
): To {
  return importElementFromXML(context, FormElementType.InputField, xml) as unknown as To
}

registerMetadata("ImportFromXML", "InputField", importInputFieldFromXML as ImportFromXMLFn)
