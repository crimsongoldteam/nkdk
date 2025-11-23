import { TConfigurationSettings } from "../metadata/configurationSettings/types"
import { TElementType } from "../metadata/forms/elements/types"
import { formatProperty, getElementRules } from "../rulesManager/rulesManager"

export const formatElementProperties = (
  elementType: TElementType,
  value: object | undefined,
  configurationSettings: TConfigurationSettings
): object | undefined => {
  if (!value) {
    return undefined
  }

  const result: Record<string, string> = {}

  const rules = getElementRules(elementType)

  for (const [keyItem, valueItem] of Object.entries(value)) {
    const rule = rules[keyItem]
    if (!rule) continue
    if (keyItem === "childItems") continue
    // if (keyItem === "contextMenu") continue
    // if (keyItem === "extendedTooltip") continue
    // if (keyItem === "title") continue
    // if (keyItem === "dataPath") continue
    // if (keyItem === "editMode") continue
    // if (keyItem === "autoCommandBar") continue
    // if (keyItem === "visible") continue
    // if (keyItem === "commandName") continue
    // if (keyItem === "type") continue
    // if (keyItem === "toolTip") continue
    // if (keyItem === "group") continue
    // if (keyItem === "horizontalStretch") continue
    // if (keyItem === "representation") continue
    // if (keyItem === "behavior") continue
    // if (keyItem === "showTitle") continue
    const resultItem = formatProperty(valueItem, rule, configurationSettings)
    if (!resultItem) continue
    result[rule.nameEnterprise] = resultItem
  }

  if (Object.keys(result).length === 0) {
    return undefined
  }

  const sortedResult = Object.fromEntries(
    Object.entries(result).sort((a, b) => a[0].localeCompare(b[0]))
  )

  return sortedResult
}
