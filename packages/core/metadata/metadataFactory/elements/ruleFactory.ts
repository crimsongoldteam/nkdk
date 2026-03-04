import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { importSingleElementFromYAML, PropertyRule } from ".."
import { FormElementType } from "../metadataType/types"
import { ToYAML } from "../rules"
import { registerTypeRule } from "../types/factory"
import { TypeRulesNames } from "../types/types"
import { importSingleElementFromXML } from "./fromXML"
import { exportSingleElementToXML } from "./toXML"
import { exportElementToPartialYAML } from "./toYAML"
import { ElementRule, ElementXML, RegisterAsTypeRule } from "./types"

export const getElementRule = <T extends BaseElement>(itemType: FormElementType): ElementRule => {
  const rule = elementRulesRegistry.get(itemType)
  if (!rule) {
    throw new Error(`Unknown element type: ${itemType}`)
  }
  return rule
}

export function registerElementRule<T extends BaseElement>(itemType: FormElementType, elementRule: ElementRule): void {
  elementRulesRegistry.set(itemType, elementRule)

  registerAsTypeRegistry(itemType, elementRule)
}

export const clearElementRulesRegistry = (): void => {
  elementRulesRegistry.clear()
}
const registerAsTypeRegistry = <T extends BaseElement>(itemType: FormElementType, elementRule: ElementRule): void => {
  if (!elementRule.registerAsType) return

  for (const [propertyType, propertyRule] of Object.entries(elementRule.registerAsType) as [
    TypeRulesNames,
    RegisterAsTypeRule,
  ][]) {
    registerImportFromXML<T>(propertyType, itemType, elementRule)
    registerExportToYAML<T>(propertyType)
    registerImportFromYAML<T>(propertyType, itemType)
    registerExportToXML<T>({ propertyType, propertyRule, elementRule, itemType })
  }
}

const registerImportFromXML = <T extends BaseElement>(
  propertyType: TypeRulesNames,
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
const registerExportToYAML = <T extends BaseElement>(propertyType: TypeRulesNames): void => {
  registerTypeRule(
    propertyType,
    "exportToYAML",
    (context: ConfigurationContext, _rule: PropertyRule, data: T | undefined): ToYAML<T> | undefined => {
      return exportElementToPartialYAML({ context, element: data })
    }
  )
}

const registerImportFromYAML = <T extends BaseElement>(
  propertyType: TypeRulesNames,
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
  propertyType: TypeRulesNames
  propertyRule: RegisterAsTypeRule
  elementRule: ElementRule
  itemType: FormElementType
}): void => {
  const { propertyType, propertyRule, elementRule, itemType } = params
  const toXMLFn = propertyRule.toXML

  registerTypeRule(
    propertyType,
    "exportToXML",
    (context: ConfigurationContext, _rule: PropertyRule, value: T | undefined): ElementXML => {
      const extraParams = toXMLFn(context, value)

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
