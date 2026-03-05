import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import { exportChildItemsToNKDK } from "../commonObjects/childItems/toNKDK"
import { exportAutoCommandBarToNKDK } from "../elements/autoCommandBar/toNKDK"
import { ClientApplicationForm } from "./types"

export const exportClientApplicationFormToStructure = (
  context: ConfigurationContext,
  element: ClientApplicationForm
): ToNKDKResult => {
  const childItems = element.childItems ?? []
  const result: ToNKDKResult = {
    strings: [],
    toOneLineGroup: false,
  }

  const autoCommandBar = exportAutoCommandBarToNKDK({ context, element: element.autoCommandBar })
  result.strings.push(...autoCommandBar.strings)

  const itemsResult = exportChildItemsToNKDK(context, childItems)
  result.strings.push(...itemsResult.strings)
  result.toOneLineGroup = result.toOneLineGroup || itemsResult.toOneLineGroup

  return result
}
