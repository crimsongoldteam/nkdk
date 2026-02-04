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
  properties: Partial<Record<Extract<keyof T, string>, PropertyRule>>
  events?: Record<string, string>
}

const elementRulesRegistry = new Map<FormElementType, ElementRule<any>>()

export function registerElementRule<T extends NamedElement>(
  elementType: FormElementType,
  elementRule: ElementRule<T>
): void {
  elementRulesRegistry.set(elementType, elementRule)
}

export const getElementRule = <T extends NamedElement>(elementType: FormElementType): ElementRule<T> => {
  const rule = elementRulesRegistry.get(elementType)
  if (!rule) {
    throw new Error(`Unknown element type: ${elementType}`)
  }
  return rule
}

export const clearElementRulesRegistry = (): void => {
  elementRulesRegistry.clear()
}
