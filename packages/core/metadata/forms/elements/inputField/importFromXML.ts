import { ConfigurationContext } from "~/metadata/context/types"
import { InputField } from "~/metadata/forms/elements/inputField/types"
import { importElementFromXML, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType, ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importInputFieldFromXML<To extends InputField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: ToXMLType<To> | undefined
): To {
  return importElementFromXML(context, FormElementType.InputField, xml) as unknown as To
}

registerMetadata("ImportFromXML", "InputField", importInputFieldFromXML as ImportFromXMLFn)
