import { TElementType } from "../metadata/forms/elements/types"
import {
  formatProperty as formatProperty,
  getElementRules,
} from "../rulesManager/rulesManager"

export const formatElementProperties = (
  elementType: TElementType,
  value: object | undefined
): object | undefined => {
  if (!value) {
    return undefined
  }

  const result: Record<string, string> = {}

  const rules = getElementRules(elementType)

  for (const [keyItem, valueItem] of Object.entries(value)) {
    const rule = rules[keyItem]
    if (!rule) continue
    const resultItem = formatProperty(rule, valueItem)
    if (!resultItem) continue
    result[rule.nameEnterprise] = resultItem
  }

  return result
}
