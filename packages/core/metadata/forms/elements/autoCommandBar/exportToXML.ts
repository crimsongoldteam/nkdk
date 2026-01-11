import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarXML } from "~/metadata/forms/elements/autoCommandBar/types"
import { exportCommandBarToXML } from "~/metadata/forms/elements/commandBar/exportToXML"

export const exportAutoCommandBarToXML = (
  context: ConfigurationContext,
  data: AutoCommandBar | undefined
): AutoCommandBarXML | undefined => {
  return exportCommandBarToXML(context, data) as AutoCommandBarXML | undefined
}
