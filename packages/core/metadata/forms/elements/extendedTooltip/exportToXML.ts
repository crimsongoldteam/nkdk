import { ConfigurationContext } from "~/metadata/context/types"
import { ExtendedTooltip, ExtendedTooltipXML } from "~/metadata/forms/elements/extendedTooltip/types"
import { exportFormDecorationToXML } from "~/metadata/forms/elements/formDecoration/exportToXML"

export const exportExtendedTooltipToXML = (
  context: ConfigurationContext,
  data: ExtendedTooltip | undefined
): ExtendedTooltipXML | undefined => {
  return exportFormDecorationToXML(context, data)
}
