import { NamedElement } from "../forms/elements/baseElement/types"
import { TypeRulesNames } from "./typeRulesFactory"
import { FormElementType } from "./types"

interface BasePropertyRule {
  yaml: string
  xml?: string
  enterprise?: boolean
}

export interface I8nTextPropertyRule extends BasePropertyRule {
  type: "I8nText"
  yamlPartialOthers?: boolean
}

export interface FormattedI8nTextPropertyRule extends BasePropertyRule {
  type: "FormattedI8nText"
  yamlFormatted: string
  yamlPartialOthers?: boolean
}

export interface SystemEnumerationPropertyRule extends BasePropertyRule {
  type: "SystemEnumeration"
  typeSE: string
}

export interface UserVisiblePropertyRule extends BasePropertyRule {
  type: "UserVisible"
  yaml: string
  yamlDeny: string
}

export interface CleanPropertyRule extends BasePropertyRule {
  type: Exclude<TypeRulesNames, "SystemEnumeration" | "I8nText" | "FormattedI8nText" | "UserVisible">
}

export type PropertyRule =
  | SystemEnumerationPropertyRule
  | UserVisiblePropertyRule
  | I8nTextPropertyRule
  | FormattedI8nTextPropertyRule
  | CleanPropertyRule

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
