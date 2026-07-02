import {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "../../../context/types"
import { BaseElement } from "../baseElement/types"
import { ToMetadata, ToYAML } from "../../../orchestration/metadataItem/registry"
import { ExportToXMLFunctionNew } from "../../../orchestration/property/fn"
import { exportSingleElementToXML } from "./toXML"
import { exportElementToPartialYAML } from "./toYAML"
import { exportSingleElementRuleToJSONSchema } from "./toJSONSchema"
import { PropertyRuleType } from "../../../orchestration/property/registry"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import type { MetadataItem, PropertyRule } from "../../../orchestration/property/types"
import { importSingleElementFromXML } from "./fromXML"
import { importSingleElementFromYAML } from "./fromYAML"
import { applyReferenceNameMode, type SingletonNameStyle } from "./singletonName"
import type { ElementRule, ElementType, ElementXML, ElementXMLWithoutId, SingleElementType } from "./types"

export const getElementRule = <Rule extends ElementRule>(itemType: Rule["itemType"]): Rule => {
  const rule = elementRulesRegistry.get(itemType)
  if (!rule) {
    throw new Error(`Unknown element type: ${itemType}`)
  }
  return rule as Rule
}

export const getElementXMLTagName = <Rule extends ElementRule>(itemType: Rule["itemType"]): string => {
  const rule = getElementRule(itemType)
  return rule.xmlTag ?? rule.itemType
}

export function registerElementRule(itemType: ElementType, elementRule: ElementRule): void {
  elementRulesRegistry.set(itemType, elementRule)

  // registerAsTypeRegistry(itemType, elementRule)
}

export const clearElementRulesRegistry = (): void => {
  elementRulesRegistry.clear()
}

type ToXMLFn<T extends BaseElement> = (params: {
  context: ConfigurationContextWithExportToXML
  element: T | undefined
}) => { name: string } & Partial<T>

export const registerElementAsType = <Rule extends ElementRule & { itemType: SingleElementType }>(params: {
  propertyType: PropertyRuleType
  elementRule: Rule
  toXML: ToXMLFn<ToMetadata<Rule["itemType"]>>
  nameStyle?: SingletonNameStyle
}): void => {
  const { propertyType, elementRule, toXML, nameStyle } = params
  const itemType = elementRule.itemType

  registerImportFromXML({ propertyType, elementRule, nameStyle })
  registerExportToYAML(propertyType)
  registerimportFromYAML(propertyType, itemType)
  registerExportToXML({ propertyType, toXML, elementRule, nameStyle })
  registerExportToJSONSchema({ propertyType, elementRule })
}

const registerImportFromXML = <Rule extends ElementRule>(params: {
  propertyType: PropertyRuleType
  elementRule: Rule
  nameStyle?: SingletonNameStyle
}): void => {
  const { propertyType, elementRule, nameStyle } = params

  registerTypeRule(
    propertyType,
    "importFromXML",
    (
      context: ConfigurationContextFromXML,
      _rule: PropertyRule,
      xml: ElementXML,
      ownerXmlName?: string
    ): ToMetadata<Rule["itemType"]> | undefined => {
      return importSingleElementFromXML({
        context,
        elementRule: elementRule,
        xml,
        nameStyle,
        ownerXmlName,
      }) as ToMetadata<Rule["itemType"]> | undefined
    }
  )
}
const registerExportToYAML = <T extends BaseElement>(propertyType: PropertyRuleType): void => {
  registerTypeRule(
    propertyType,
    "exportToYAML",
    (
      context: ConfigurationContext,
      _rule: PropertyRule,
      data: ToMetadata<T["itemType"]> | undefined
    ): ToYAML<T["itemType"]> | undefined => {
      return exportElementToPartialYAML({ context, element: data })
    }
  )
}

const registerimportFromYAML = <Type extends SingleElementType>(
  propertyType: PropertyRuleType,
  itemType: Type
): void => {
  registerTypeRule(
    propertyType,
    "importFromYAML",
    (
      context: ConfigurationContext,
      _rule: PropertyRule,
      yaml: ToYAML<Type> | undefined,
      source?: ToMetadata<Type>
    ): ToMetadata<Type> | undefined => {
      return importSingleElementFromYAML({
        context,
        itemType: itemType,
        yaml,
        source,
      })
    }
  )
}

const registerExportToXML = <Rule extends ElementRule>(params: {
  propertyType: PropertyRuleType
  toXML: ToXMLFn<ToMetadata<Rule["itemType"]>>
  elementRule: Rule
  nameStyle?: SingletonNameStyle
}): void => {
  const { propertyType, toXML, elementRule, nameStyle } = params

  const fn: ExportToXMLFunctionNew = (params: {
    context: ConfigurationContextWithExportToXML
    rule: PropertyRule
    metadataItem?: MetadataItem | undefined
    referenceMetadata?: MetadataItem | undefined
    value: any
  }): ElementXMLWithoutId => {
    const { context, value, referenceMetadata } = params
    const element = value as ToMetadata<Rule["itemType"]> | undefined
    const referenceElement = referenceMetadata as ToMetadata<Rule["itemType"]> | undefined
    const extraParams = toXML({ context, element })
    const name = applyReferenceNameMode({
      generatedName: extraParams.name,
      referenceElement,
      nameStyle,
    })
    const referenceElementForXML = nameStyle === undefined ? referenceElement : omitReferenceName(referenceElement)

    return exportSingleElementToXML({
      context,
      element,
      rule: elementRule,
      referenceElement: referenceElementForXML,
      additionalParams: {
        ...extraParams,
        name,
      },
    })
  }

  registerTypeRule(propertyType, "exportToXML", fn)
}

const registerExportToJSONSchema = <Rule extends ElementRule>(params: {
  propertyType: PropertyRuleType
  elementRule: Rule
}): void => {
  const { propertyType, elementRule } = params

  registerTypeRule(propertyType, "exportToJSONSchema", ({ context }) =>
    exportSingleElementRuleToJSONSchema({
      context,
      rule: elementRule,
    })
  )
}

const omitReferenceName = <T extends object | undefined>(referenceElement: T): T => {
  if (referenceElement === undefined || !Object.prototype.hasOwnProperty.call(referenceElement, "name")) {
    return referenceElement
  }

  const referenceElementWithoutName = { ...referenceElement }
  delete (referenceElementWithoutName as { name?: unknown }).name
  return referenceElementWithoutName as T
}

const elementRulesRegistry = new Map<ElementType, ElementRule>()
