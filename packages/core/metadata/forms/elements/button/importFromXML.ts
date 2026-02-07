import { ConfigurationContext } from "~/metadata/context/types"
import { Button } from "~/metadata/forms/elements/button/types"
import { importElementFromXML, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType, ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importButtonFromXML<To extends Button | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: ToXMLType<To> | undefined
): To {
  return importElementFromXML(context, FormElementType.Button, xml) as To
}

registerMetadata("ImportFromXML", "Button", importButtonFromXML as ImportFromXMLFn)
