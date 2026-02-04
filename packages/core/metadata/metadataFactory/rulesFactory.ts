import { NamedElement } from "../forms/elements/baseElement/types"
import { FormElementType } from "./types"

export interface PropertyRule {
  yaml: string
  yamlAlt?: string
  type: string
  typeDetailed?: string
  xml?: string
  enterprise?: boolean
}

export interface ElementRule<T extends NamedElement> {
  properties?: Partial<Record<Extract<keyof T, string>, PropertyRule>>
  events?: Record<string, string>
}

export interface ElementRuleFromXML {
  properties: Record<string, PropertyRule>
  events: Record<string, string> | undefined
}

export interface ElementRuleFromYAML {
  properties: Record<string, PropertyRule>
  events: Record<string, string> | undefined
}

export interface RulesRegistryItem {
  base: ElementRule<any>
  fromXML: ElementRuleFromXML
  fromYAML: ElementRuleFromYAML
}

const elementRulesRegistry = new Map<FormElementType, RulesRegistryItem>()

export function registerElementRule<T extends NamedElement>(
  elementType: FormElementType,
  elementRule: ElementRule<T>
): void {
  const item: RulesRegistryItem = {
    base: elementRule,
    fromXML: createRulesRegistryItemFromXML(elementRule),
    fromYAML: createRulesRegistryItemFromYAML(elementRule),
  }

  elementRulesRegistry.set(elementType, item)
}

/** Преобразует camelCase строку в PascalCase */
function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function createRulesRegistryItemFromXML<E extends ElementRule<any>>(elementRule: E): ElementRuleFromXML {
  const properties: Record<string, PropertyRule | undefined> = {}

  if (elementRule.properties) {
    for (const [key, propertyRule] of Object.entries(elementRule.properties)) {
      if (!propertyRule) continue
      const xmlKey = propertyRule.xml ?? toPascalCase(key)
      properties[xmlKey] = propertyRule
    }
  }

  // Фильтруем undefined значения перед возвратом
  const filteredProperties = Object.fromEntries(
    Object.entries(properties).filter(([, value]): value is PropertyRule => value !== undefined)
  ) as Record<string, PropertyRule>

  return {
    properties: filteredProperties,
    events: elementRule.events,
  }
}

function createRulesRegistryItemFromYAML<E extends ElementRule<any>>(elementRule: E): ElementRuleFromYAML {
  const properties: Record<string, PropertyRule | undefined> = {}

  // Обрабатываем свойства
  if (elementRule.properties) {
    for (const [_, propertyRule] of Object.entries(elementRule.properties)) {
      if (!propertyRule) continue

      // fromYAML: ключ из поля yaml
      const yamlKey = propertyRule.yaml
      properties[yamlKey] = propertyRule
    }
  }

  // Фильтруем undefined значения перед возвратом
  const filteredProperties = Object.fromEntries(
    Object.entries(properties).filter(([, value]): value is PropertyRule => value !== undefined)
  ) as Record<string, PropertyRule>

  return {
    properties: filteredProperties,
    events: elementRule.events,
  }
}

export const getElementRule = <T extends NamedElement>(elementType: FormElementType): ElementRule<T> => {
  const rule = elementRulesRegistry.get(elementType)
  if (!rule) {
    throw new Error(`Unknown element type: ${elementType}`)
  }
  return rule.base
}

export const getElementRuleFromYAML = (elementType: FormElementType): ElementRuleFromYAML => {
  const rule = elementRulesRegistry.get(elementType)
  if (!rule) {
    throw new Error(`Unknown element type: ${elementType}`)
  }
  return rule.fromYAML
}

export const getElementRuleFromXML = (elementType: FormElementType): ElementRuleFromXML => {
  const rule = elementRulesRegistry.get(elementType)
  if (!rule) {
    throw new Error(`Unknown element type: ${elementType}`)
  }
  return rule.fromXML
}

export const clearElementRulesRegistry = (): void => {
  elementRulesRegistry.clear()
}
