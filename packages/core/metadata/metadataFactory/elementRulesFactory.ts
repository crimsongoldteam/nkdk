import { ConfigurationContext } from "../context/types"
import { TableAdditionalSourceTypes } from "../forms/commonObjects/tableAdditionalSource/types"
import { BaseElement, EventedElement } from "../forms/elements/baseElement/types"
import { exportElementToPartialYAML } from "./element/exportElementToEnterprise"
import { exportSingleElementToXML } from "./element/exportElementToXML"
import { importElementFromPartialYAML } from "./element/importElementFromEnterprise"
import { importSingleElementFromXML } from "./element/importElementFromXML"
import { registerTypeRule, TypeRulesNames } from "./typeRulesFactory"
import { ElementXML, FormElementType, ToPartialEnterpriseType } from "./types"

export type ExportCheckFn = <T extends BaseElement>(
  context: ConfigurationContext,
  rule: PropertyRule<T>,
  element: T
) => boolean

interface BasePropertyRule<T extends BaseElement | never> {
  yaml?: T extends BaseElement ? keyof ToPartialEnterpriseType<T> : string
  xml?: string
  toEnterprise?: false
  toPartialYAML?: false | ExportCheckFn
  fromXML?: false
  defaultValue?: any
}

export interface I8nTextPropertyRule<T extends BaseElement | never> extends BasePropertyRule<T> {
  type: "I8nText"
  yamlPartialOthers?: true
}

export interface FormattedI8nTextPropertyRule<T extends BaseElement | never> extends BasePropertyRule<T> {
  type: "FormattedI8nText"
  yamlFormatted: string
  yamlPartialOthers?: true
  xmlWithDefaultLanguage?: true
}

export interface SystemEnumerationPropertyRule<T extends BaseElement | never> extends BasePropertyRule<T> {
  type: "SystemEnumeration"

  typeSE: string
}

export interface UserVisiblePropertyRule<T extends BaseElement | never> extends BasePropertyRule<T> {
  type: "UserVisible"
  yaml: T extends BaseElement ? keyof ToPartialEnterpriseType<T> : string
  yamlDeny: string
}

export interface TableAdditionalSourcePropertyRule<T extends BaseElement | never> extends BasePropertyRule<T> {
  type: "TableAdditionalSource"
  additionalSourceType: TableAdditionalSourceTypes
  forSingleElement?: true
}

export interface CleanPropertyRule<T extends BaseElement | never> extends BasePropertyRule<T> {
  type: Exclude<
    TypeRulesNames,
    "SystemEnumeration" | "I8nText" | "FormattedI8nText" | "UserVisible" | "TableAdditionalSource"
  >
}

export interface CustomExportPropertyRule<T extends BaseElement | never> extends BasePropertyRule<T> {
  type?: never
  exportToEnterprise: (context: ConfigurationContext, rule: PropertyRule<T>, data: any) => any
}

export type PropertyRule<T extends BaseElement | never> =
  | SystemEnumerationPropertyRule<T>
  | UserVisiblePropertyRule<T>
  | I8nTextPropertyRule<T>
  | FormattedI8nTextPropertyRule<T>
  | CleanPropertyRule<T>
  | CustomExportPropertyRule<T>
  | TableAdditionalSourcePropertyRule<T>

interface RegisterAsTypeRule<T extends BaseElement> {
  toXML: (context: ConfigurationContext, element: T | undefined) => { id: string; name: string }
}

type PropertiesType<T extends BaseElement, ExtraProperties extends string = never> = Partial<
  Record<Exclude<keyof T, "elementType" | "name"> | ExtraProperties, PropertyRule<T>>
>

// ? Record<Extract<keyof Extract<T, EventedElement>["events"], string>, string>

export interface ElementRule<T extends BaseElement, ExtraProperties extends string = never> {
  properties: PropertiesType<T, ExtraProperties>
  d: T extends EventedElement ? keyof T["events"][number] : undefined
  events: T extends EventedElement
    ? Record<keyof Required<T["events"]>, string>
    : // Record<
      //   Extract<keyof Required<T["events"]>, string>,
      //   ToPartialEnterpriseType<T> extends EventedElementYAML ? keyof EventedElementYAML["События"] : never
      // >
      undefined
  enterpriseField?: "FormField" | "FormDecoration" | "FormTable" | "FormGroup" | "FormButton"
  alwaysExportToXML?: true
  registerAsType?: Partial<Record<TypeRulesNames, RegisterAsTypeRule<T>>>
}

const elementRulesRegistry = new Map<FormElementType, ElementRule<any>>()

export function registerElementRule<T extends BaseElement>(
  elementType: FormElementType,
  elementRule: ElementRule<T>
): void {
  elementRulesRegistry.set(elementType, elementRule)

  registerAsTypeRegistry(elementType, elementRule)
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

const registerAsTypeRegistry = <T extends BaseElement>(
  elementType: FormElementType,
  elementRule: ElementRule<T>
): void => {
  if (!elementRule.registerAsType) return

  for (const [propertyType, propertyRule] of Object.entries(elementRule.registerAsType) as [
    TypeRulesNames,
    RegisterAsTypeRule<T>,
  ][]) {
    registerImportFromXML<T>(propertyType, elementType, elementRule)
    registerExportToEnterprise<T>(propertyType)
    registerImportFromEnterprise<T>(propertyType, elementType)
    registerExportToXML<T>({ propertyType, propertyRule, elementRule, elementType })
  }
}

const registerImportFromXML = <T extends BaseElement>(
  propertyType: TypeRulesNames,
  elementType: FormElementType,
  elementRule: ElementRule<T>
): void => {
  registerTypeRule(
    propertyType,
    "importFromXML",
    (context: ConfigurationContext, _rule: PropertyRule<T>, xml: ElementXML): T | undefined => {
      return importSingleElementFromXML({
        context,
        elementType: elementType,
        rule: elementRule,
        xml,
      })
    }
  )
}

const registerExportToEnterprise = <T extends BaseElement>(propertyType: TypeRulesNames): void => {
  registerTypeRule(
    propertyType,
    "exportToEnterprise",
    (
      context: ConfigurationContext,
      _rule: PropertyRule<T>,
      data: T | undefined
    ): ToPartialEnterpriseType<T> | undefined => {
      return exportElementToPartialYAML({ context, element: data })
    }
  )
}

const registerImportFromEnterprise = <T extends BaseElement>(
  propertyType: TypeRulesNames,
  elementType: FormElementType
): void => {
  registerTypeRule(
    propertyType,
    "importFromEnterprise",
    (
      context: ConfigurationContext,
      _rule: PropertyRule<T>,
      yaml: ToPartialEnterpriseType<T> | undefined,
      source?: T
    ): T | undefined => {
      return importElementFromPartialYAML({
        context,
        elementType: elementType,
        yaml,
        source,
      })
    }
  )
}

const registerExportToXML = <T extends BaseElement>(params: {
  propertyType: TypeRulesNames
  propertyRule: RegisterAsTypeRule<T>
  elementRule: ElementRule<T>
  elementType: FormElementType
}): void => {
  const { propertyType, propertyRule, elementRule, elementType } = params
  const toXMLFn = propertyRule.toXML

  registerTypeRule(
    propertyType,
    "exportToXML",
    (context: ConfigurationContext, _rule: PropertyRule<T>, value: T | undefined): ElementXML => {
      const extraParams = toXMLFn(context, value)

      return exportSingleElementToXML({
        context,
        element: value,
        rule: elementRule,
        elementType: elementType,
        ...extraParams,
      })
    }
  )
}
