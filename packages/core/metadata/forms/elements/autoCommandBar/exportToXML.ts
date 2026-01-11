import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarXML } from "~/metadata/forms/elements/autoCommandBar/types"
import { exportCommandBarToXML } from "~/metadata/forms/elements/commandBar/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"

export const exportAutoCommandBarToXML = (
  context: ConfigurationContext,
  data: AutoCommandBar | undefined
): AutoCommandBarXML => {
  const result = exportCommandBarToXML(context, data) as AutoCommandBarXML | undefined
  if (result) {
    const sorted = sortObject(result) as AutoCommandBarXML
    sorted._id = "-1"
    return sorted
  }
  return result
}

// getDefaultAutoCommandBarL = (): AutoCommandBarXML => {
//   return
//     _id: "-1",
//   }
// }
