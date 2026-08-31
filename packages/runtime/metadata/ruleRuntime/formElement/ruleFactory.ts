import { ConfigurationContextWithExportToXML } from "../../context/types"
import { getChildContextToXML } from "../../context/childContext"
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
  withConfigurationIndexExportLogicalAddress,
} from "../../configurationIndex/referenceView"
import {
  getCanonicalSingletonName,
  getSingletonName,
  getSingletonNameVariant,
  resolveExplicitSingletonName,
  type SingletonNameStyle,
  withSingletonNameVariantToXML,
} from "./singletonName"
import type { ElementRule, ElementXML, SingleElementType } from "./types"
import { defineMetadataRules } from "../definition"
import type { MetadataRulesDefinition } from "../definition"
import { emptyMetadataRules } from "../definition/testSupport"
import { registerFormXmlIdReservation } from "../../configurationIndex/formXmlIdReservation"
import { resolveFormElementXMLId } from "./xmlIdentity"
import { copyXmlAnomalyExportClaim } from "../xmlAnomaly/exportClaim"
export {
  defineElementRule,
  getElementRule,
  getElementXMLTagName,
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
  ...(params.directId === undefined ? { requiredIdentity: "xmlId" as const } : {}),
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
  resolveItemName: ({ context, yaml, ownerName }) => {
    const effectiveOwnerName = ownerName ?? context.exportToXML.itemsTree.at(-1)?.name
    const generatedName = getSingletonName({
      ownerLogicalAddress: effectiveOwnerName ?? "",
      nameStyle: params.nameStyle,
      variant: context.exportToXML.formElementNameVariant,
    }) ?? params.toXML({ context }).name
    return resolveExplicitSingletonName({ yaml, generatedName, nameStyle: params.nameStyle })
  },
  resolveItemContext: ({ context, name, itemName }) => {
    if (itemName === undefined) return context
    const ownerXmlName = name ?? context.exportToXML.itemsTree.at(-1)?.name
    const childContext = getChildContextToXML({
          context,
          itemType: params.elementRule.itemType,
          path: `${params.elementRule.itemType}.${itemName}`,
          name: itemName,
        })
    return withSingletonNameVariantToXML(childContext, getSingletonNameVariant({
      xmlName: itemName,
      ownerXmlName,
      nameStyle: params.nameStyle,
    }))
  },
  transformOutput: (outputParams) => {
    const { context, itemName, xml } = outputParams
    const { _name, _id, ...properties } = xml
    const runtime = params.directId === undefined ? context.exportToXML.configurationIndex : undefined
    const indexedId = params.directId === undefined ? resolveFormElementXMLId(context) : undefined
    const result = {
      _name:
        itemName ?? (
          typeof _name === "string" && _name.length > 0
            ? _name
            : ""
        ),
      _id: params.directId ?? (typeof _id === "string" && _id.length > 0 ? _id : (indexedId ?? "")),
      ...properties,
    }
    copyXmlAnomalyExportClaim(xml, result)
    const transformed = params.transformOutput?.({ ...outputParams, xml: result }) ?? result
    copyXmlAnomalyExportClaim(result, transformed)
    if (transformed !== null && typeof transformed === "object" && !Array.isArray(transformed)) {
      registerFormXmlIdReservation(transformed, {
        ...(runtime === undefined ? {} : { runtime }),
        space: "elements",
        ...(params.directId === undefined ? {} : { specialId: params.directId }),
      })
    }
    return transformed
  },
})

export const defineElementAsType = <Rule extends ElementRule & { itemType: SingleElementType }>(params: {
  propertyType: PropertyRuleType
  elementRule: Rule
  toXML: ToXMLFn<ToMetadata<Rule["itemType"]>>
  nameStyle?: SingletonNameStyle
  directId?: string
}): MetadataRulesDefinition<never> => {
  const { propertyType, elementRule, toXML, nameStyle } = params
  const propertyTypeRules: PropertyTypeRuleContribution[] = []
  propertyTypeRules.push(definePropertyTypeRule(propertyType, "importFromXMLToYAML", ({ context, xml, ownerXmlName, traversal }) =>
    importSingleFormElementFromXMLToYAML({
      context,
      rule: elementRule,
      xml: xml as ElementXML | undefined,
      ownerXmlName,
      nameStyle,
      directId: params.directId,
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
  propertyTypeRules.push(defineExportToJSONSchema({ propertyType, elementRule, nameStyle }))

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
  nameStyle?: SingletonNameStyle
}): PropertyTypeRuleContribution => {
  const { propertyType, elementRule, nameStyle } = params

  return definePropertyTypeRule(propertyType, "exportToJSONSchema", ({ context }) =>
    exportSingleElementRuleToJSONSchema({
      context,
      rule: elementRule,
      explicitXMLName: nameStyle?.explicitXMLName,
    })
  )
}
