import { ConfigurationContext } from "~/metadata/context/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "~/metadata/forms/elements/extendedTooltip/types"
import { importFormDecorationFromEnterprise } from "~/metadata/forms/elements/formDecoration/importFromEnterprise"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importExtendedTooltipFromEnterprise = (
  context: ConfigurationContext,
  data: ExtendedTooltipEnterprise | undefined,
  name?: string
): ExtendedTooltip | undefined => {
  const result = importFormDecorationFromEnterprise(context, data, name)
  if (!result) return undefined

  return {
    ...result,
    elementType: FormElementType.FormDecoration,
  }
}
