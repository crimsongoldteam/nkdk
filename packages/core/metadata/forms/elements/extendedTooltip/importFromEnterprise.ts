import { ConfigurationContext } from "~/metadata/context/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "~/metadata/forms/elements/extendedTooltip/types"
import { importFormDecorationFromEnterprise } from "~/metadata/forms/elements/formDecoration/importFromEnterprise"
import { FormElementType } from "~/metadata/metadataFactory/types"

type ImportExtendedTooltipFromEnterpriseReturn<T> = T extends undefined ? undefined : ExtendedTooltip

export function importExtendedTooltipFromEnterprise<T extends ExtendedTooltipEnterprise | undefined>(
  context: ConfigurationContext,
  data: T
): ImportExtendedTooltipFromEnterpriseReturn<T> {
  if (data === undefined) return undefined as ImportExtendedTooltipFromEnterpriseReturn<T>

  const result = importFormDecorationFromEnterprise(context, data, data.Имя)

  return {
    ...result,
    elementType: FormElementType.FormDecoration,
  }
}
