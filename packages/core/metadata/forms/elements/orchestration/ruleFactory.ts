import { ConfigurationContextWithExportToXML } from "../../../context/types"
import { BaseElement } from "../baseElement/types"
import { ToMetadata } from "../../../orchestration/metadataItem/registry"
import { exportSingleElementRuleToJSONSchema } from "./toJSONSchema"
import { PropertyRuleType } from "../../../orchestration/property/registry"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { importSingleFormElementFromXMLToYAML } from "./fromXMLToYAML"
import type { SingletonNameStyle } from "./singletonName"
import type { ElementRule, ElementType, ElementXML, SingleElementType } from "./types"

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
}) => { name: string } & Partial<T>

export const registerElementAsType = <Rule extends ElementRule & { itemType: SingleElementType }>(params: {
  propertyType: PropertyRuleType
  elementRule: Rule
  toXML: ToXMLFn<ToMetadata<Rule["itemType"]>>
  nameStyle?: SingletonNameStyle
  directId?: string
}): void => {
  const { propertyType, elementRule, toXML, nameStyle } = params
  registerTypeRule(propertyType, "importFromXMLToYAML", ({ context, xml, ownerXmlName, traversal }) =>
    importSingleFormElementFromXMLToYAML({
      context,
      rule: elementRule,
      xml: xml as ElementXML | undefined,
      ownerXmlName,
      nameStyle,
      traversal,
    })
  )
  registerTypeRule(propertyType, "nestedItemRule", { itemRule: elementRule })
  registerTypeRule(propertyType, "yamlToXMLNestedRule", {
    kind: "item",
    itemRule: elementRule,
    transformOutput: ({ context, xml }) => {
      const extra = toXML({ context })
      return {
        _name: typeof xml._name === "string" ? xml._name : extra.name,
        _id: typeof xml._id === "string" ? xml._id : (params.directId ?? String(extra.id ?? "")),
        ...xml,
      }
    },
  })
  registerExportToJSONSchema({ propertyType, elementRule })
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

const elementRulesRegistry = new Map<ElementType, ElementRule>()
