import { ConfigurationContext } from "~/metadata/context/types"
import { UsualGroup } from "~/metadata/forms/elements/usualGroup/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export function importUsualGroupFromXML<To extends UsualGroup | undefined>(
  context: ConfigurationContext,
  xml: ElementXML | undefined
): To {
  return importElementFromXML<UsualGroup>(context, FormElementType.UsualGroup, xml) as To
}
