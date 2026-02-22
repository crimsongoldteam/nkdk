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
  const result: ToNKDKResult = []

  const autoCommandBar = exportAutoCommandBarToStructure(context, element.autoCommandBar)
  result.push(...autoCommandBar)

  const itemsResult = exportChildItemsToStructure(context, childItems)
  result.push(...itemsResult)

  return result
}
