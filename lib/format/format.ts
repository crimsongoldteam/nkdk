import { TElementType } from "../metadata/forms/elements/types"
import { formatProperty as formatProperty } from "../rulesManager/rulesManager"

export const formatElementProperties = (
  elementType: TElementType,
  value: object | undefined
): object | undefined => {
  if (!value) {
    return undefined
  }

  const result: Record<string, string> = {}

  for (const [keyItem, valueItem] of Object.entries(value)) {
    const resultItem = formatProperty(elementType, keyItem, valueItem)
    if (!resultItem) continue
    result[keyItem] = resultItem
  }

  return result
}
