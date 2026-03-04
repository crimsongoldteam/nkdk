import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import {
  ElementRule,
  ElementXML,
  ExtendedFormElementType,
  FormElementType,
  MetadataItemTypeToMdItem,
  MetadataItemTypeToYAML,
  PropertyRule,
  SingleFormElementType,
} from "~/metadata/orchestration"
import { exportSingleElementToXML } from "~/metadata/orchestration/formElement/toXML"
import { exportElementToPartialYAML } from "~/metadata/orchestration/formElement/toYAML"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { registerTypeRule } from "./factory"
import { importSingleElementFromXML } from "./fromXML"
import { importSingleElementFromYAML } from "./fromYAML"

export const getElementRule = (itemType: ExtendedFormElementType): ElementRule => {
  const rule = elementRulesRegistry.get(itemType)
  if (!rule) {
    throw new Error(`Unknown element type: ${itemType}`)
  }
  return rule
}

export function registerElementRule(itemType: ExtendedFormElementType, elementRule: ElementRule): void {
  elementRulesRegistry.set(itemType, elementRule)

  // registerAsTypeRegistry(itemType, elementRule)
}

export const clearElementRulesRegistry = (): void => {
  elementRulesRegistry.clear()
}

type ToXMLFn<T extends BaseElement> = (
  context: ConfigurationContext,
  element: T | undefined
) => { id: string; name: string }

export const registerElementAsType = <Rule extends ElementRule>(params: {
  propertyType: PropertyRuleType
  elementRule: Rule
  toXML: ToXMLFn<MetadataItemTypeToMdItem<Rule["itemType"]>>
}): void => {
  const { propertyType, elementRule, toXML } = params
  const itemType = elementRule.itemType

  type ElementType = MetadataItemTypeToMdItem<Rule["itemType"]>
  // if (!elementRule.registerAsType) return

  // for (const [propertyType, propertyRule] of Object.entries(elementRule.registerAsType) as [
  //   PropertyRuleType,
  //   RegisterAsTypeRule,
  // ][]) {

  registerImportFromXML<ElementType>(propertyType, itemType, elementRule)
  registerExportToYAML<ElementType>(propertyType)
  registerImportFromYAML(propertyType, itemType)
  registerExportToXML<ElementType>({ propertyType, toXML, elementRule, itemType })
}
// }

const registerImportFromXML = <Type extends SingleFormElementType>(
  propertyType: PropertyRuleType,
  itemType: Type,
  elementRule: ElementRule
): void => {
  registerTypeRule(
    propertyType,
    "importFromXML",
    (
      context: ConfigurationContext,
      _rule: PropertyRule,
      xml: ElementXML
    ): MetadataItemTypeToMdItem<Type> | undefined => {
      return importSingleElementFromXML({
        context,
        itemType: itemType,
        rule: elementRule,
        xml,
      })
    }
  )
}
const registerExportToYAML = <T extends BaseElement>(propertyType: PropertyRuleType): void => {
  registerTypeRule(
    propertyType,
    "exportToYAML",
    (context: ConfigurationContext, _rule: PropertyRule, data: T | undefined): ToYAML<T> | undefined => {
      return exportElementToPartialYAML({ context, element: data })
    }
  )
}

const registerImportFromYAML = <Type extends SingleFormElementType>(
  propertyType: PropertyRuleType,
  itemType: Type
): void => {
  registerTypeRule(
    propertyType,
    "importFromYAML",
    (
      context: ConfigurationContext,
      _rule: PropertyRule,
      yaml: MetadataItemTypeToYAML<Type> | undefined,
      source?: MetadataItemTypeToMdItem<Type>
    ): MetadataItemTypeToMdItem<Type> | undefined => {
      return importSingleElementFromYAML({
        context,
        itemType: itemType,
        yaml,
        source,
      })
    }
  )
}

const registerExportToXML = <T extends BaseElement>(params: {
  propertyType: PropertyRuleType
  toXML: ToXMLFn<T>
  elementRule: ElementRule
  itemType: FormElementType
}): void => {
  const { propertyType, toXML, elementRule, itemType } = params

  registerTypeRule(
    propertyType,
    "exportToXML",
    (context: ConfigurationContext, _rule: PropertyRule, value: T | undefined): ElementXML => {
      const extraParams = toXML(context, value)

      return exportSingleElementToXML({
        context,
        element: value,
        rule: elementRule,
        itemType: itemType,
        ...extraParams,
      })
    }
  )
}

const elementRulesRegistry = new Map<ExtendedFormElementType, ElementRule>()
