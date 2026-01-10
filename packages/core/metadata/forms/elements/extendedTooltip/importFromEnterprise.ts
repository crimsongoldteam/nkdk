import { ConfigurationContext } from "~/metadata/context/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "~/metadata/forms/elements/extendedTooltip/types"
import { importFormDecorationFromEnterprise } from "~/metadata/forms/elements/formDecoration/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export function importExtendedTooltipFromEnterprise<T extends ExtendedTooltipEnterprise | undefined>(
  context: ConfigurationContext,
  data: T
): ImportFromEnterpriseReturn<T, string, ExtendedTooltip> {
  if (data === undefined) return undefined as ImportFromEnterpriseReturn<T, string, ExtendedTooltip>

  const result = importFormDecorationFromEnterprise(context, data, data.Имя)

  return {
    ...result,
    elementType: FormElementType.FormDecoration,
  } as ImportFromEnterpriseReturn<T, string, ExtendedTooltip>
}
