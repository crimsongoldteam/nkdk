import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/forms/format/types"
import { exportChildItemsToStructure } from "../commonObjects/childItems/exportToStructure"
import { exportAutoCommandBarToStructure } from "../elements/autoCommandBar/exportToStructure"
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

  const autoCommandBar = exportAutoCommandBarToStructure(context, element.autoCommandBar)
  result.strings.push(...autoCommandBar.strings)

  const itemsResult = exportChildItemsToStructure(context, childItems)
  result.strings.push(...itemsResult.strings)
  result.toOneLineGroup = result.toOneLineGroup || itemsResult.toOneLineGroup

  return result
}
