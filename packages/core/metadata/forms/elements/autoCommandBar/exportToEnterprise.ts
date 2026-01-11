import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarEnterprise } from "~/metadata/forms/elements/autoCommandBar/types"
import { exportCommandBarToEnterprise } from "~/metadata/forms/elements/commandBar/exportToEnterprise"

export const exportAutoCommandBarToEnterprise = (
  context: ConfigurationContext,
  data: AutoCommandBar | undefined
): AutoCommandBarEnterprise | undefined => {
  return exportCommandBarToEnterprise(context, data) as AutoCommandBarEnterprise | undefined
}
