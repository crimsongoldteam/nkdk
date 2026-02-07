import { ConfigurationContext } from "~/metadata/context/types"
import { CheckBoxField } from "~/metadata/forms/elements/checkBoxField/types"
import { importElementFromXML, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType, ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importCheckBoxFieldFromXML<To extends CheckBoxField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ToXMLType<To> | undefined
): To {
  return importElementFromXML(context, FormElementType.CheckBoxField, xml) as unknown as To
}

registerMetadata("ImportFromXML", "CheckBoxField", importCheckBoxFieldFromXML as ImportFromXMLFn)
