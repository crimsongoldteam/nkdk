import { collectConfigurationIndexIdentityFromXML } from "../../configurationIndex/collector/collectProperty"
import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexFormElementLogicalAddress,
  getConfigurationIndexFormSingletonLogicalAddress,
  withConfigurationIndexLogicalAddress,
} from "../../configurationIndex/collector/context"
import type { ConfigurationContextFromXML } from "../../context/types"
import { importPropertiesFromXMLToYAML } from "../property/fromXMLToYAML"
import type { DirectImportTraversal } from "../property/importYamlTypes"
import type { CompiledPropertyRuleExecution } from "../property/compiledPropertyPlan"
import { enterNestedYamlRule } from "../property/yamlRuleCursor"
import {
  attachExplicitSingletonName,
  getCanonicalSingletonName,
  getSingletonName,
  getSingletonNameVariant,
  type SingletonNameStyle,
  withSingletonNameVariantFromXML,
} from "./singletonName"
import { CollectableElementTypeToYAML, type CollectableElementType, type ElementRule, type ElementXML } from "./types"
import { currentRuleRegistrySet } from "../ruleRegistryExecutionContext"
import { arrangeProperties } from "../../../helpers/arrangeProperties"
import { formElementTreeRule } from "./treeRule"
import { isXmlElementNode, xmlAttributeValue, type XmlElementNode } from "../../../xml/import/document"

export function importFormElementFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: ElementRule & { itemType: CollectableElementType }
  xml: ElementXML | XmlElementNode
  name: string
  traversal: DirectImportTraversal
}): Record<string, unknown> {
  const kind = currentRuleRegistrySet<{ formElementKinds: ReadonlyMap<string, string> }>()
    ?.formElementKinds.get(params.rule.itemType) ?? CollectableElementTypeToYAML[params.rule.itemType]
  params.traversal.facts?.acceptProperty({
    itemType: params.rule.itemType,
    itemRule: params.rule,
    propertyKey: "$formElementKind",
    yamlPath: [...params.traversal.yamlPath, "Вид"],
    value: kind,
  })
  const initialYAML = { Вид: kind }
  return importFormElementPropertiesFromXMLToYAML({
    ...params, rule: formElementTreeRule(params.rule), initialYAML,
    beforeFinish: arrangeFormElementProperties,
  }) ?? initialYAML
}

function arrangeFormElementProperties(result: Record<string, unknown>): void {
  const keys = Object.keys(result)
  arrangeProperties(result, keys, [
    "Вид",
    ...keys.filter(key => key !== "Вид" && key !== "ТипКнопки"),
    ...(Object.prototype.hasOwnProperty.call(result, "ТипКнопки") ? ["ТипКнопки"] : []),
  ])
}

export function importFormElementPropertiesFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: ElementRule & { itemType: CollectableElementType }
  xml: ElementXML | XmlElementNode
  name: string
  traversal: DirectImportTraversal
  initialYAML?: Record<string, unknown>
  beforeFinish?: (yaml: Record<string, unknown>) => void
}): Record<string, unknown> | undefined {
  return importPropertiesFromXMLToYAML({
    ...params.traversal,
    initialYAML: params.initialYAML,
    beforeFinish: params.beforeFinish,
    context: params.context,
    rule: params.rule,
    sources: [{
      context: params.context,
      xml: params.traversal.xmlNodes?.length === 1
        ? params.traversal.xmlNodes[0]!
        : params.xml,
    }],
    itemName: params.name,
    rulePath: enterNestedYamlRule(params.traversal, params.rule.itemType).rulePath,
    execution: propertyExecutionFromTraversal(params.traversal),
  })
}

export function importSingleFormElementFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: ElementRule
  xml: ElementXML | XmlElementNode | undefined
  ownerXmlName?: string
  nameStyle?: SingletonNameStyle
  directId?: string
  traversal: DirectImportTraversal
}): Record<string, unknown> | undefined {
  if (params.xml === undefined) return undefined

  const collection = getConfigurationIndexCollectionContext(params.context)
  const inheritedNameVariant = params.context.fromXML.formElementNameVariant
  const canonicalName = getCanonicalSingletonName({
    ownerLogicalAddress: params.ownerXmlName ?? collection?.logicalAddress ?? "",
    nameStyle: params.nameStyle,
  })
  const logicalAddress =
    collection === undefined
      ? undefined
      : params.nameStyle?.canonicalNameMode === "ownerSuffix"
        ? getConfigurationIndexFormSingletonLogicalAddress(collection, params.nameStyle.canonicalSuffix)
        : canonicalName === undefined
          ? collection.logicalAddress
          : getConfigurationIndexFormElementLogicalAddress(collection, canonicalName)
  const context =
    logicalAddress === undefined ? params.context : withConfigurationIndexLogicalAddress(params.context, logicalAddress)
  const generatedName = getSingletonName({
    ownerLogicalAddress: params.ownerXmlName ?? collection?.logicalAddress ?? "",
    nameStyle: params.nameStyle,
    variant: inheritedNameVariant,
  })
  const xmlName = isXmlElementNode(params.xml)
    ? xmlAttributeValue(params.xml, "name")
    : typeof params.xml._name === "string" ? params.xml._name : undefined
  const nameVariant = getSingletonNameVariant({
    xmlName,
    ownerXmlName: params.ownerXmlName,
    nameStyle: params.nameStyle,
  })
  const itemContext = withSingletonNameVariantFromXML(context, nameVariant)

  if (params.directId === undefined) {
    collectConfigurationIndexIdentityFromXML({
      context: itemContext, sourceXmlKey: "_id",
      xmlValue: isXmlElementNode(params.xml) ? xmlAttributeValue(params.xml, "id") : params.xml._id,
    })
  }
  const initialYAML = {}
  attachExplicitSingletonName({ yaml: initialYAML, xmlName, generatedName, nameStyle: params.nameStyle })
  const explicitName = Object.prototype.hasOwnProperty.call(initialYAML, "Имя")
  const yaml = (
    importPropertiesFromXMLToYAML({
      ...params.traversal,
      initialYAML,
      beforeFinish: explicitName ? arrangeExplicitSingletonName : undefined,
      context: itemContext,
      rule: params.rule,
      sources: [{
        context: itemContext,
        xml: params.traversal.xmlNodes?.[0] ?? (!isXmlElementNode(params.xml) && params.nameStyle?.explicitXMLName === true
          ? withoutImportableXMLName(params.xml)
          : params.xml),
      }],
      itemName: xmlName ?? canonicalName,
      rulePath: enterNestedYamlRule(params.traversal, params.rule.itemType).rulePath,
      produceResult: params.traversal.mode === "facts" ? false : params.traversal.produceResult,
      execution: propertyExecutionFromTraversal(params.traversal),
    }) ?? initialYAML
  )
  return yaml
}

function arrangeExplicitSingletonName(yaml: Record<string, unknown>): void {
  const keys = Object.keys(yaml)
  arrangeProperties(yaml, keys, [...keys.filter(key => key !== "Имя"), "Имя"])
}

function withoutImportableXMLName(xml: ElementXML): ElementXML {
  const { _name, ...properties } = xml
  const result = properties as ElementXML
  Object.defineProperty(result, "_name", { value: _name, enumerable: false })
  return result
}

function propertyExecutionFromTraversal(
  traversal: DirectImportTraversal,
): CompiledPropertyRuleExecution | undefined {
  return traversal.execution as CompiledPropertyRuleExecution | undefined
}
