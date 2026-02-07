import { ConfigurationContext } from "../context/types"
import { EventedElement, NamedElement } from "../forms/elements/baseElement/types"
import { TypeRulesNames } from "./typeRulesFactory"
import { FormElementType } from "./types"

export type ExportCheckFn = <T extends NamedElement>(
  context: ConfigurationContext,
  rule: PropertyRule,
  element: T
) => boolean

interface BasePropertyRule {
  yaml: string
  xml?: string
  toEnterprise?: false
  toYAML?: false | ExportCheckFn
}

export interface I8nTextPropertyRule extends BasePropertyRule {
  type: "I8nText"
  yamlPartialOthers?: true
}

export interface FormattedI8nTextPropertyRule extends BasePropertyRule {
  type: "FormattedI8nText"
  yamlFormatted: string
  yamlPartialOthers?: true
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

export interface CustomExportPropertyRule extends BasePropertyRule {
  type?: never
  exportToEnterprise: (context: ConfigurationContext, rule: PropertyRule, data: any) => any
}

export type PropertyRule =
  | SystemEnumerationPropertyRule
  | UserVisiblePropertyRule
  | I8nTextPropertyRule
  | FormattedI8nTextPropertyRule
  | CleanPropertyRule
  | CustomExportPropertyRule

export interface ElementRule<T extends NamedElement | EventedElement> {
  properties: Partial<Record<Extract<keyof T, string>, PropertyRule>>
  events?: T extends EventedElement
    ? Record<Extract<keyof Extract<T, EventedElement>["events"], string>, string>
    : never
  enterpriseField: string
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
