import { ConfigurationContext } from "~/metadata/context/types"
import { mockRule } from "~/tests/mockContext"
import { exportCommandBarItemsToStructure, formatCommandBarContent } from "../../format/commandBarHelpers"
import { IFormatElementResult } from "../../format/types"
import { PropertyRule } from "../calendarField/rules"
import { AutoCommandBar } from "./types"

export const exportAutoCommandBarToStructure = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  element: AutoCommandBar | undefined
): IFormatElementResult => {
  if (!element) return { strings: [], haveSimpleHorizontalGroup: false }

  const content = exportAutoCommandBarContentToStructure(context, mockRule, element)

  return {
    strings: [content],
    haveSimpleHorizontalGroup: false,
  }
}

export const exportAutoCommandBarContentToStructure = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  element: AutoCommandBar
): string => {
  const buttonStrings = exportCommandBarItemsToStructure(context, mockRule, element.childItems)
  const autofill = element.autofill !== false

  return formatCommandBarContent(buttonStrings, autofill)
}
