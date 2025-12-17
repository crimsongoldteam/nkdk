import { parse } from "yaml"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { getElementRules } from "~/lib/rulesManager/rulesManager"
import { TElementRule } from "~/lib/rulesManager/types"
import { BaseElement } from "../../baseElement/types"

export const parseProperties = (
  yamlContent: string,
  elementsMap: Record<string, BaseElement>,
  configurationSettings: ConfigurationSettings
): Record<string, BaseElement> => {
  const data = parse(yamlContent) as Record<string, any>

  const result: Record<string, BaseElement> = { ...elementsMap }

  for (const [elementName, properties] of Object.entries(data)) {
    if (!properties || typeof properties !== "object") {
      continue
    }

    const element = elementsMap[elementName]
    if (!element) throw new Error(`Element "${elementName}" not found`)

    const parsedProperties = parseElementProperties(element, properties, configurationSettings)
    result[elementName] = {
      ...element,
      ...parsedProperties,
    }
  }

  return result
}

const parseElementProperties = (
  element: BaseElement,
  properties: Record<string, any>,
  configurationSettings: ConfigurationSettings
) => {
  const result: Record<string, any> = {}
  const rules = getElementRules(element.elementType)
  if (!rules) throw new Error(`Rules for element "${element.elementType}" not found`)

  for (const [key, value] of Object.entries(properties)) {
    // Find rule by nameEnterprise (key from YAML) instead of property key
    const rule = Object.values(rules).find((r) => r.nameEnterprise === key)
    if (!rule) throw new Error(`Rule for property "${key}" not found`)

    // Find the property key (e.g., "readOnly") by nameEnterprise
    const propertyKey = Object.keys(rules).find((k) => rules[k].nameEnterprise === key)
    if (!propertyKey) throw new Error(`Property key for "${key}" not found`)

    const parsedValue = parseProperty(value, configurationSettings, rule)
    if (parsedValue === undefined || parsedValue === null) throw new Error(`Failed to parse property "${key}"`)
    result[propertyKey] = parsedValue
  }

  return result
}

const parseProperty = (value: any, configurationSettings: ConfigurationSettings, rule: TElementRule) => {
  if (!rule) throw new Error("Rule not found")
  return rule.parseProperties ? rule.parseProperties(value, configurationSettings, rule) : value
}
