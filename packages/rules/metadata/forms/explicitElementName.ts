import type { SingletonNameStyle } from "../ruleRuntime/formElement/singletonName"

const EXPLICIT_NAME_ITEM_TYPES = new Set([
  "ExtendedTooltip",
  "ContextMenu",
  "AutoCommandBar",
  "SearchStringAddition",
  "SearchControlAddition",
  "ViewStatusAddition",
  "GanttChartFieldTable",
])

export function explicitElementNameStyle(
  itemType: string,
  style: Omit<SingletonNameStyle, "explicitXMLName">,
): SingletonNameStyle {
  if (!EXPLICIT_NAME_ITEM_TYPES.has(itemType)) {
    throw new Error(`Тип ${itemType} не поддерживает явное XML-имя`)
  }
  return { ...style, explicitXMLName: true }
}
