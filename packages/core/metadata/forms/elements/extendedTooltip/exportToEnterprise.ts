import { ConfigurationContext } from "~/metadata/context/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "~/metadata/forms/elements/extendedTooltip/types"
import { exportFormDecorationToEnterprise } from "~/metadata/forms/elements/formDecoration/exportToEnterprise"

export function exportExtendedTooltipToEnterprise(context: ConfigurationContext, data: undefined): undefined
export function exportExtendedTooltipToEnterprise(
  context: ConfigurationContext,
  data: ExtendedTooltip
): ExtendedTooltipEnterprise
export function exportExtendedTooltipToEnterprise(
  context: ConfigurationContext,
  data: ExtendedTooltip | undefined
): ExtendedTooltipEnterprise | undefined {
  if (!data) return undefined

  return {
    ...exportFormDecorationToEnterprise(context, data),
    Имя: data.name,
  }
}
