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

export interface RulesRegistryItem {
  base: ElementRule<any>
  fromXML: {
    properties: Record<string, PropertyRule>
    events: Record<string, string> | undefined
  }
  fromYAML: {
    properties: Record<string, PropertyRule>
    events: Record<string, string> | undefined
  }
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

function createRulesRegistryItemFromXML<E extends ElementRule<any>>(elementRule: E): 
type RulesRegistryItem.fromXML {
  const properties: Record<string, PropertyRule | undefined> = {}

  if (elementRule.properties) {
    for (const [key, propertyRule] of Object.entries(elementRule.properties)) {
      if (!propertyRule) continue
      const xmlKey = propertyRule.xml ?? toPascalCase(key)
      properties[xmlKey] = propertyRule
    }
  }

  return {
    properties,
    events: elementRule.events,
  }
}

/**
 * Создает fromYAML правила из базового ElementRule
 * @param elementRule - базовое правило элемента
 * @returns объект с fromYAML правилами
 */
function createRulesRegistryItemFromYAML<E extends ElementRule<any>>(
  elementRule: E
): {
  properties: Record<string, PropertyRule | undefined>
  events: Record<string, string> | undefined
} {
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

  return {
    properties,
    events: elementRule.events,
  }
}

export const getElementRule = <T extends NamedElement>(elementType: FormElementType): ElementRule<T> | undefined => {
  return elementRulesRegistry.get(elementType) as ElementRule<T> | undefined
}

export const getElementRuleXMLMap = (
  elementType: FormElementType
):
  | {
      properties: Record<string, PropertyRule | undefined>
      events: Record<string, string> | undefined
    }
  | undefined => {
  const elementRule = elementRulesRegistry.get(elementType)
  if (!elementRule) return undefined
  return createRulesRegistryItemFromXML(elementRule)
}

export const getElementRuleYAMLMap = (
  elementType: FormElementType
):
  | {
      properties: Record<string, PropertyRule | undefined>
      events: Record<string, string> | undefined
    }
  | undefined => {
  const elementRule = elementRulesRegistry.get(elementType)
  if (!elementRule) return undefined
  return createRulesRegistryItemFromYAML(elementRule)
}

export const getElementRuleOrThrow = <T extends NamedElement>(elementType: FormElementType): ElementRule<T> => {
  const rule = elementRulesRegistry.get(elementType)
  if (!rule) {
    throw new Error(`Unknown element type: ${elementType}`)
  }
  return rule as ElementRule<T>
}

export const clearElementRulesRegistry = (): void => {
  elementRulesRegistry.clear()
}
