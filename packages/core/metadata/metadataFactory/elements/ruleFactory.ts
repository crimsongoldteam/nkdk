import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { importSingleElementFromYAML, PropertyRule } from ".."
import { PropertyRuleType } from "../../orchestration/property/fn"
import { FormElementType } from "../metadataType/types"
import { ToYAML } from "../rules"
import { registerTypeRule } from "../types/factory"
import { importSingleElementFromXML } from "./fromXML"
import { exportSingleElementToXML } from "./toXML"
import { exportElementToPartialYAML } from "./toYAML"
import { ElementRule, ElementXML } from "./types"

export const getElementRule = (itemType: FormElementType): ElementRule => {
  const rule = elementRulesRegistry.get(itemType)
  if (!rule) {
    throw new Error(`Unknown element type: ${itemType}`)
  }
  return rule
}

export function registerElementRule(itemType: FormElementType, elementRule: ElementRule): void {
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

export const registerElementAsType = <T extends BaseElement>(params: {
  propertyType: PropertyRuleType
  elementRule: ElementRule
  toXML: ToXMLFn<T>
}): void => {
  const { propertyType, elementRule, toXML } = params
  const itemType = elementRule.itemType
  // if (!elementRule.registerAsType) return

  // for (const [propertyType, propertyRule] of Object.entries(elementRule.registerAsType) as [
  //   PropertyRuleType,
  //   RegisterAsTypeRule,
  // ][]) {

  registerImportFromXML<T>(propertyType, itemType, elementRule)
  registerExportToYAML<T>(propertyType)
  registerImportFromYAML<T>(propertyType, itemType)
  registerExportToXML<T>({ propertyType, toXML, elementRule, itemType })
}
// }

const registerImportFromXML = <T extends BaseElement>(
  propertyType: PropertyRuleType,
  itemType: FormElementType,
  elementRule: ElementRule
): void => {
  registerTypeRule(
    propertyType,
    "importFromXML",
    (context: ConfigurationContext, _rule: PropertyRule, xml: ElementXML): T | undefined => {
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

const registerImportFromYAML = <T extends BaseElement>(
  propertyType: PropertyRuleType,
  itemType: FormElementType
): void => {
  registerTypeRule(
    propertyType,
    "importFromYAML",
    (context: ConfigurationContext, _rule: PropertyRule, yaml: ToYAML<T> | undefined, source?: T): T | undefined => {
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

const elementRulesRegistry = new Map<FormElementType, ElementRule>()
