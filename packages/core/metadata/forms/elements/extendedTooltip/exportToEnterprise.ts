import { ConfigurationContext } from "~/metadata/context/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "~/metadata/forms/elements/extendedTooltip/types"
import { exportFormDecorationToEnterprise } from "~/metadata/forms/elements/formDecoration/exportToEnterprise"

type ExportExtendedTooltipToEnterpriseReturn<T> = T extends undefined ? undefined : ExtendedTooltipEnterprise

export function exportExtendedTooltipToEnterprise<T extends ExtendedTooltip | undefined>(
  context: ConfigurationContext,
  data: T
): ExportExtendedTooltipToEnterpriseReturn<T> {
  if (data === undefined) return undefined as ExportExtendedTooltipToEnterpriseReturn<T>

  return {
    ...exportFormDecorationToEnterprise(context, data),
    Имя: data.name,
  } as ExportExtendedTooltipToEnterpriseReturn<T>
}
