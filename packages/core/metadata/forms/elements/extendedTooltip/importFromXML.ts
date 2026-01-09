import { ConfigurationContext } from "~/metadata/context/types"
import { ExtendedTooltip, ExtendedTooltipXML } from "~/metadata/forms/elements/extendedTooltip/types"
import { importFormDecorationFromXML } from "~/metadata/forms/elements/formDecoration/importFromXML"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importExtendedTooltipFromXML = (
  context: ConfigurationContext,
  xml: ExtendedTooltipXML | undefined
): ExtendedTooltip | undefined => {
  const result = importFormDecorationFromXML(context, xml)
  if (!result) return undefined

  return {
    ...result,
    elementType: FormElementType.FormDecoration,
  }
}
