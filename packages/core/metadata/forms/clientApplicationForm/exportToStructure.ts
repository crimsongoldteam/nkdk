import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { exportChildItemsToStructure } from "../commonObjects/childItems/exportToStructure"
import { exportAutoCommandBarToStructure } from "../elements/autoCommandBar/exportToStructure"
import { ClientApplicationForm } from "./types"

export const exportClientApplicationFormToStructure = (
  context: ConfigurationContext,
  element: ClientApplicationForm
): IFormatElementResult => {
  const childItems = element.childItems ?? []
  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const autoCommandBar = exportAutoCommandBarToStructure(context, element.autoCommandBar)
  result.push(...autoCommandBar)

  const itemsResult = exportChildItemsToStructure(context, childItems)
  result.push(...itemsResult)

  return result
}
