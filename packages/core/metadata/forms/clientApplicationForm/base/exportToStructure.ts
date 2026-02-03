import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { exportChildItemsToStructure } from "../../collections/childItems/exportToStructure"
import { exportAutoCommandBarToStructure } from "../../elements/autoCommandBar/exportToStructure"
import { PropertyRule } from "../../elements/calendarField/rules"
import { ClientApplicationForm } from "./types"

export const exportClientApplicationFormToStructure = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  element: ClientApplicationForm
): IFormatElementResult => {
  const childItems = element.childItems ?? []
  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const autoCommandBar = exportAutoCommandBarToStructure(context, rule, element.autoCommandBar)
  result.strings.push(...autoCommandBar.strings)

  const itemsResult = exportChildItemsToStructure(context, rule, childItems)
  result.strings.push(...itemsResult.strings)
  result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || itemsResult.haveSimpleHorizontalGroup

  return result
}
