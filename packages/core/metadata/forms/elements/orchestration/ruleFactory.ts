import { ConfigurationContextWithExportToXML } from "../../../context/types"
import { BaseElement } from "../baseElement/types"
import { ToMetadata } from "../../../orchestration/metadataItem/registry"
import { exportSingleElementRuleToJSONSchema } from "./toJSONSchema"
import { PropertyRuleType } from "../../../orchestration/property/registry"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { importSingleFormElementFromXMLToYAML } from "./fromXMLToYAML"
import {
  configurationIndexExportFormElementLogicalAddress,
  configurationIndexExportFormSingletonLogicalAddress,
  withConfigurationIndexExportLogicalAddress,
} from "../../../configurationIndex/referenceView"
import { getCanonicalSingletonName, type SingletonNameStyle } from "./singletonName"
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
    resolveContext: ({ context, name }) => {
      const canonicalName = getCanonicalSingletonName({
        ownerLogicalAddress: name ?? context.exportToXML.configurationIndex?.logicalAddress ?? "",
        nameStyle,
      })
      const logicalAddress =
        nameStyle?.canonicalNameMode === "ownerSuffix"
          ? configurationIndexExportFormSingletonLogicalAddress(context, nameStyle.canonicalSuffix)
          : canonicalName === undefined
            ? undefined
            : configurationIndexExportFormElementLogicalAddress(context, canonicalName)
      return logicalAddress === undefined
        ? context
        : withConfigurationIndexExportLogicalAddress(context, logicalAddress)
    },
    transformOutput: ({ context, xml }) => {
      const extra = toXML({ context })
      const runtime = context.exportToXML.configurationIndex
      const indexedName = runtime?.identity("xmlName")
      const indexedId = runtime?.identity("xmlId")
      if (indexedName !== undefined) runtime?.collector.setXmlName(runtime.logicalAddress, indexedName)
      if (indexedId !== undefined) runtime?.collector.setXmlId(runtime.logicalAddress, indexedId)
      return {
        ...xml,
        _name: typeof xml._name === "string" ? xml._name : (indexedName ?? extra.name),
        _id:
          typeof xml._id === "string" && xml._id.length > 0
            ? xml._id
            : (indexedId ?? params.directId ?? String(extra.id ?? "")),
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
