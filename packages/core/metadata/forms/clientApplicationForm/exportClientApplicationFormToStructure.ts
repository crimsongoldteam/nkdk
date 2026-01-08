import { formatElements } from "~/format/formatFactory"
import { IFormatElementResult } from "~/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
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

  const itemsResult = formatElements(childItems, context)
  result.strings.push(...itemsResult.strings)
  result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || itemsResult.haveSimpleHorizontalGroup

  return result
}
