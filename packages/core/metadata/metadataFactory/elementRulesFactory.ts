import { ConfigurationContext } from "../context/types"
import { BaseElement, EventedElement } from "../forms/elements/baseElement/types"
import { TypeRulesNames } from "./typeRulesFactory"
import { FormElementType, ToPartialEnterpriseType } from "./types"

export type ExportCheckFn = <T extends BaseElement>(
  context: ConfigurationContext,
  rule: PropertyRule<T>,
  element: T
) => boolean

interface BasePropertyRule<T extends BaseElement> {
  yaml?: keyof ToPartialEnterpriseType<T>
  xml?: string
  toEnterprise?: false
  toYAML?: false | ExportCheckFn
  defaultValue?: any
}

export interface I8nTextPropertyRule<T extends BaseElement> extends BasePropertyRule<T> {
  type: "I8nText"
  yamlPartialOthers?: true
}

export interface FormattedI8nTextPropertyRule<T extends BaseElement> extends BasePropertyRule<T> {
  type: "FormattedI8nText"
  yamlFormatted: string
  yamlPartialOthers?: true
  xmlWithDefaultLanguage?: true
}

export interface SystemEnumerationPropertyRule<T extends BaseElement> extends BasePropertyRule<T> {
  type: "SystemEnumeration"
  typeSE: string
}

export interface UserVisiblePropertyRule<T extends BaseElement> extends BasePropertyRule<T> {
  type: "UserVisible"
  yamlDeny: string
}

export interface CleanPropertyRule<T extends BaseElement> extends BasePropertyRule<T> {
  type: Exclude<TypeRulesNames, "SystemEnumeration" | "I8nText" | "FormattedI8nText" | "UserVisible">
}

export interface CustomExportPropertyRule<T extends BaseElement> extends BasePropertyRule<T> {
  type?: never
  exportToEnterprise: (context: ConfigurationContext, rule: PropertyRule<T>, data: any) => any
}

export type PropertyRule<T extends BaseElement> =
  | SystemEnumerationPropertyRule<T>
  | UserVisiblePropertyRule<T>
  | I8nTextPropertyRule<T>
  | FormattedI8nTextPropertyRule<T>
  | CleanPropertyRule<T>
  | CustomExportPropertyRule<T>

export interface ElementRule<T extends BaseElement> {
  properties: Partial<Record<Extract<keyof T, string>, PropertyRule<T>>>
  events?: T extends EventedElement
    ? Record<Extract<keyof Extract<T, EventedElement>["events"], string>, string>
    : never
  enterpriseField: "FormField" | "FormDecoration" | "Table" | "FormGroup"
  alwaysExportToXML?: true
}

const elementRulesRegistry = new Map<FormElementType, ElementRule<any>>()

export function registerElementRule<T extends BaseElement>(
  elementType: FormElementType,
  elementRule: ElementRule<T>
): void {
  elementRulesRegistry.set(elementType, elementRule)
}

export const getElementRule = <T extends BaseElement>(elementType: FormElementType): ElementRule<T> => {
  const rule = elementRulesRegistry.get(elementType)
  if (!rule) {
    throw new Error(`Unknown element type: ${elementType}`)
  }
  return rule
}

export const clearElementRulesRegistry = (): void => {
  elementRulesRegistry.clear()
}
