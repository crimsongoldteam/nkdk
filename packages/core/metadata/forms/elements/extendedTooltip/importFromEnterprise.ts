import { ConfigurationContext } from "~/metadata/context/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "~/metadata/forms/elements/extendedTooltip/types"
import { importFormDecorationFromEnterprise } from "~/metadata/forms/elements/formDecoration/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export function importExtendedTooltipFromEnterprise<T extends ExtendedTooltipEnterprise | undefined>(
  context: ConfigurationContext,
  data: T
): ImportFromEnterpriseReturn<T, ExtendedTooltip, string> {
  if (data === undefined) return undefined as ImportFromEnterpriseReturn<T, ExtendedTooltip, string>

  const result = importFormDecorationFromEnterprise(context, data, data.Имя)

  return {
    ...result,
    elementType: FormElementType.FormDecoration,
  } as ImportFromEnterpriseReturn<T, ExtendedTooltip, string>
}
