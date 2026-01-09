import { ConfigurationContext } from "~/metadata/context/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "~/metadata/forms/elements/extendedTooltip/types"
import { exportFormDecorationToEnterprise } from "~/metadata/forms/elements/formDecoration/exportToEnterprise"

export const exportExtendedTooltipToEnterprise = (
  context: ConfigurationContext,
  data: ExtendedTooltip | undefined
): ExtendedTooltipEnterprise | undefined => {
  return exportFormDecorationToEnterprise(context, data)
}
