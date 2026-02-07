import { ConfigurationContext } from "~/metadata/context/types"
import { ButtonGroup } from "./types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function importButtonGroupFromXML<To extends ButtonGroup | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  return importElementFromXML<ButtonGroup>(context, FormElementType.ButtonGroup, xml) as To
}
