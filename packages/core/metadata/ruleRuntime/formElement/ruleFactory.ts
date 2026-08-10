import { ConfigurationContextWithExportToXML } from "../../context/types"
import { getChildContextToXML } from "../../context/helpers"
import { ToMetadata } from "../metadataItem/registry"
import { exportSingleElementRuleToJSONSchema } from "./toJSONSchema"
import { PropertyRuleType } from "../property/registry"
import { registerLegacyPropertyTypeDefinitions } from "../property/typeRuleRegistry"
import {
  definePropertyTypeRule,
  propertyTypesFromContributions,
  type PropertyTypeRuleContribution,
} from "../property/propertyRuleRegistrySet"
import type { YAMLToXMLNestedRule } from "../property/fromYAMLToXMLTypes"
import { importSingleFormElementFromXMLToYAML } from "./fromXMLToYAML"
import {
  configurationIndexExportFormElementLogicalAddress,
  configurationIndexExportFormSingletonLogicalAddress,
  getConfigurationIndexXmlName,
  withConfigurationIndexExportLogicalAddress,
} from "../../configurationIndex/referenceView"
import { getCanonicalSingletonName, type SingletonNameStyle } from "./singletonName"
import type { ElementRule, ElementXML, SingleElementType } from "./types"
import { defineMetadataRules } from "../definition"
import type { MetadataRulesDefinition } from "../definition"
import { emptyMetadataRules } from "../definition/testSupport"
export {
  clearElementRulesRegistry,
  defineElementRule,
  getElementRule,
  getElementXMLTagName,
  registerElementRule,
} from "./ruleRegistry"

type ToXMLFn<T extends object> = (params: {
  context: ConfigurationContextWithExportToXML
}) => { name: string } & Partial<T>

type SingletonElementYAMLToXMLNestedRule = Extract<YAMLToXMLNestedRule, { kind: "item" }>

export const createSingletonElementYAMLToXMLNestedRule = <Rule extends ElementRule>(params: {
  elementRule: Rule
  toXML: ToXMLFn<ToMetadata<Rule["itemType"]>>
  nameStyle?: SingletonNameStyle
  directId?: string
  transformOutput?: NonNullable<SingletonElementYAMLToXMLNestedRule["transformOutput"]>
}): SingletonElementYAMLToXMLNestedRule => ({
  kind: "item",
  itemRule: params.elementRule,
  requiredIdentity: "xmlId",
  resolveContext: ({ context, name }) => {
    const canonicalName = getCanonicalSingletonName({
      ownerLogicalAddress: name ?? context.exportToXML.configurationIndex?.logicalAddress ?? "",
      nameStyle: params.nameStyle,
    })
    const logicalAddress =
      params.nameStyle?.canonicalNameMode === "ownerSuffix"
        ? configurationIndexExportFormSingletonLogicalAddress(context, params.nameStyle.canonicalSuffix)
        : canonicalName === undefined
          ? undefined
          : configurationIndexExportFormElementLogicalAddress(context, canonicalName)
    return logicalAddress === undefined ? context : withConfigurationIndexExportLogicalAddress(context, logicalAddress)
  },
  resolveItemContext: ({ context }) => {
    const itemName = getConfigurationIndexXmlName(context) ?? params.toXML({ context }).name
    return itemName === undefined
      ? context
      : getChildContextToXML({
          context,
          itemType: params.elementRule.itemType,
          path: `${params.elementRule.itemType}.${itemName}`,
          name: itemName,
        })
  },
  transformOutput: (outputParams) => {
    const { context, xml } = outputParams
    const extra = params.toXML({ context })
    const { _name, _id, ...properties } = xml
    const runtime = context.exportToXML.configurationIndex
    const indexedName = getConfigurationIndexXmlName(context)
    const indexedId = runtime?.identity("xmlId")
    if (indexedName !== undefined) {
      runtime?.collector.setIdentity(runtime.logicalAddress, "xmlName", indexedName)
    }
    if (indexedId !== undefined) runtime?.collector.setIdentity(runtime.logicalAddress, "xmlId", indexedId)
    const result = {
      _name:
        typeof _name === "string" &&
          (_name.length > 0 || indexedName === "")
          ? _name
          : (indexedName ?? extra.name),
      _id: typeof _id === "string" && _id.length > 0 ? _id : (indexedId ?? params.directId ?? String(extra.id ?? "")),
      ...properties,
    }
    return params.transformOutput?.({ ...outputParams, xml: result }) ?? result
  },
})

export const defineElementAsType = <Rule extends ElementRule & { itemType: SingleElementType }>(params: {
  propertyType: PropertyRuleType
  elementRule: Rule
  toXML: ToXMLFn<ToMetadata<Rule["itemType"]>>
  nameStyle?: SingletonNameStyle
  directId?: string
}): MetadataRulesDefinition => {
  const { propertyType, elementRule, toXML, nameStyle } = params
  const propertyTypeRules: PropertyTypeRuleContribution[] = []
  propertyTypeRules.push(definePropertyTypeRule(propertyType, "importFromXMLToYAML", ({ context, xml, ownerXmlName, traversal }) =>
    importSingleFormElementFromXMLToYAML({
      context,
      rule: elementRule,
      xml: xml as ElementXML | undefined,
      ownerXmlName,
      nameStyle,
      traversal,
    })
  ))
  propertyTypeRules.push(definePropertyTypeRule(propertyType, "nestedItemRule", { itemRule: elementRule }))
  if (nameStyle !== undefined) {
    propertyTypeRules.push(definePropertyTypeRule(propertyType, "nestedItemIdentity", {
      reserveWhenAbsent: true,
      resolveName: (ownerName) =>
        getCanonicalSingletonName({
          ownerLogicalAddress: ownerName ?? "",
          nameStyle,
        }),
    }))
  }
  propertyTypeRules.push(definePropertyTypeRule(
    propertyType,
    "yamlToXMLNestedRule",
    createSingletonElementYAMLToXMLNestedRule({ elementRule, toXML, nameStyle, directId: params.directId })
  ))
  propertyTypeRules.push(defineExportToJSONSchema({ propertyType, elementRule }))

  return defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: propertyTypesFromContributions(propertyTypeRules),
    formElements: { [elementRule.itemType]: elementRule },
  })
}

export const registerElementAsType = <Rule extends ElementRule & { itemType: SingleElementType }>(params: {
  propertyType: PropertyRuleType
  elementRule: Rule
  toXML: ToXMLFn<ToMetadata<Rule["itemType"]>>
  nameStyle?: SingletonNameStyle
  directId?: string
}): void => {
  registerLegacyPropertyTypeDefinitions(
    defineElementAsType(params).propertyTypes,
  )
}

const defineExportToJSONSchema = <Rule extends ElementRule>(params: {
  propertyType: PropertyRuleType
  elementRule: Rule
}): PropertyTypeRuleContribution => {
  const { propertyType, elementRule } = params

  return definePropertyTypeRule(propertyType, "exportToJSONSchema", ({ context }) =>
    exportSingleElementRuleToJSONSchema({
      context,
      rule: elementRule,
    })
  )
}
