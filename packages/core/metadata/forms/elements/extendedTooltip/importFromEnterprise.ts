import { ConfigurationContext } from "~/metadata/context/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "~/metadata/forms/elements/extendedTooltip/types"
import { importFormDecorationFromEnterprise } from "~/metadata/forms/elements/formDecoration/importFromEnterprise"
import { FormElementType } from "~/metadata/metadataFactory/types"

export function importExtendedTooltipFromEnterprise(context: ConfigurationContext, data: undefined): undefined
export function importExtendedTooltipFromEnterprise(
  context: ConfigurationContext,
  data: ExtendedTooltipEnterprise
): ExtendedTooltip
export function importExtendedTooltipFromEnterprise(
  context: ConfigurationContext,
  data: ExtendedTooltipEnterprise | undefined
): ExtendedTooltip | undefined {
  if (!data) return undefined

  const result = importFormDecorationFromEnterprise(context, data, data.Имя)

  return {
    ...result,
    elementType: FormElementType.FormDecoration,
  }
}
