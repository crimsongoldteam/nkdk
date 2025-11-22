import * as yaml from "js-yaml"
import { property } from "zod"
import { formatProperty, getElementRules } from "~/lib/rulesManager/rulesManager"
import { TBaseElement } from "../../baseElement/types"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const parseProperties = (
  yamlContent: string,
  elementsMap: Record<string, TBaseElement>
  configurationSettings: TConfigurationSettings 
): Record<string, TBaseElement> => {
  const data = yaml.load(yamlContent) as Record<string, any>

  const result: Record<string, TBaseElement> = { ...elementsMap }

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
  element: TBaseElement,
  properties: Record<string, any>,
  configurationSettings: TConfigurationSettings
) => {
  const result: Record<string, any> = {}
  const rules = getElementRules(element.elementType)
  if (!rules) throw new Error(`Rule for property "${property}" not found`)

  for (const [key, value] of Object.entries(properties)) {
    const rule = rules[key]
    if (!rule) throw new Error(`Rule for property "${key}" not found`)

    const parsedValue = parseProperty(value, rule, configurationSettings)
    if (!parsedValue) throw new Error(`Failed to parse property "${key}"`)
    result[key] = parsedValue
  }

  return result
}
