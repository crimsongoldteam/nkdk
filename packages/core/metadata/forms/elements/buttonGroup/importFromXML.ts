import { ConfigurationContext } from "~/metadata/context/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { ButtonGroup } from "./types"

export function importButtonGroupFromXML<To extends ButtonGroup | undefined>(
  context: ConfigurationContext,
  xml: ElementXML | undefined
): To {
  return importElementFromXML<ButtonGroup>(context, FormElementType.ButtonGroup, xml) as To
}
