import {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "~/metadata/context/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import {
  ElementRule,
  ElementType,
  ElementXML,
  ElementXMLWithoutId,
  ExportToXMLFunctionNew,
  MetadataItem,
  PropertyRule,
  SingleElementType,
  ToMetadata,
  ToYAML,
} from "~/metadata/orchestration"
import { exportSingleElementToXML } from "~/metadata/orchestration/formElement/toXML"
import { exportElementToPartialYAML } from "~/metadata/orchestration/formElement/toYAML"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { registerTypeRule } from "./factory"
import { importSingleElementFromXML } from "./fromXML"
import { importSingleElementFromYAML } from "./fromYAML"

export const getElementRule = <Rule extends ElementRule>(itemType: Rule["itemType"]): Rule => {
  const rule = elementRulesRegistry.get(itemType)
  if (!rule) {
    throw new Error(`Unknown element type: ${itemType}`)
  }
  return rule as Rule
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
}): void => {
  const { propertyType, elementRule, toXML } = params
  const itemType = elementRule.itemType

  registerImportFromXML(propertyType, elementRule)
  registerExportToYAML(propertyType)
  registerimportFromYAML(propertyType, itemType)
  registerExportToXML({ propertyType, toXML, elementRule })
}

const registerImportFromXML = <Rule extends ElementRule>(propertyType: PropertyRuleType, elementRule: Rule): void => {
  registerTypeRule(
    propertyType,
    "importFromXML",
    (
      context: ConfigurationContextFromXML,
      _rule: PropertyRule,
      xml: ElementXML
    ): ToMetadata<Rule["itemType"]> | undefined => {
      return importSingleElementFromXML({
        context,
        elementRule: elementRule,
        xml,
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
}): void => {
  const { propertyType, toXML, elementRule } = params

  const fn: ExportToXMLFunctionNew = (params: {
    context: ConfigurationContextWithExportToXML
    rule: PropertyRule
    metadataItem?: MetadataItem | undefined
    referenceMetadata?: MetadataItem | undefined
    value: any
  }): ElementXMLWithoutId => {
    const { context, value, referenceMetadata } = params
    const element = value as ToMetadata<Rule["itemType"]> | undefined
    const extraParams = toXML({ context, element })

    return exportSingleElementToXML({
      context,
      element,
      rule: elementRule,
      referenceElement: referenceMetadata as ToMetadata<Rule["itemType"]> | undefined,
      additionalParams: extraParams,
    })
  }

  registerTypeRule(propertyType, "exportToXML", fn)
}

const elementRulesRegistry = new Map<ElementType, ElementRule>()
