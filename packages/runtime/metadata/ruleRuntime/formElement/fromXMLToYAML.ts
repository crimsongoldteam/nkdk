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

export function importFormElementFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: ElementRule & { itemType: CollectableElementType }
  xml: ElementXML
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
  const result = importFormElementPropertiesFromXMLToYAML({
    ...params, rule: formElementTreeRule(params.rule), initialYAML,
  }) ?? initialYAML
  const keys = Object.keys(result)
  return arrangeProperties(result, keys, [
    "Вид",
    ...keys.filter(key => key !== "Вид" && key !== "ТипКнопки"),
    ...(Object.prototype.hasOwnProperty.call(result, "ТипКнопки") ? ["ТипКнопки"] : []),
  ])
}

export function importFormElementPropertiesFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: ElementRule & { itemType: CollectableElementType }
  xml: ElementXML
  name: string
  traversal: DirectImportTraversal
  initialYAML?: Record<string, unknown>
}): Record<string, unknown> | undefined {
  return importPropertiesFromXMLToYAML({
    initialYAML: params.initialYAML,
    context: params.context,
    rule: params.rule,
    sources: [{
      context: params.context,
      xml: params.traversal.xmlNodes?.length === 1
        ? params.traversal.xmlNodes[0]!
        : params.xml,
    }],
    itemName: params.name,
    yamlPath: params.traversal.yamlPath,
    rulePath: enterNestedYamlRule(params.traversal, params.rule.itemType).rulePath,
    collector: params.traversal.collector,
    deferred: params.traversal.deferred,
    dependent: params.traversal.dependent,
    dependencies: params.traversal.dependencies,
    roundTrip: params.traversal.roundTrip,
    audit: params.traversal.audit,
    annotations: params.traversal.annotations,
    mode: params.traversal.mode,
    facts: params.traversal.facts,
    produceResult: params.traversal.produceResult,
    profile: params.traversal.profile,
    execution: propertyExecutionFromTraversal(params.traversal),
  })
}

export function importSingleFormElementFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: ElementRule
  xml: ElementXML | undefined
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
  const xmlName = typeof params.xml._name === "string" ? params.xml._name : undefined
  const nameVariant = getSingletonNameVariant({
    xmlName,
    ownerXmlName: params.ownerXmlName,
    nameStyle: params.nameStyle,
  })
  const itemContext = withSingletonNameVariantFromXML(context, nameVariant)

  if (params.directId === undefined) {
    collectConfigurationIndexIdentityFromXML({ context: itemContext, sourceXmlKey: "_id", xmlValue: params.xml._id })
  }
  const initialYAML = {}
  attachExplicitSingletonName({ yaml: initialYAML, xmlName, generatedName, nameStyle: params.nameStyle })
  const explicitName = Object.prototype.hasOwnProperty.call(initialYAML, "Имя")
  const yaml = (
    importPropertiesFromXMLToYAML({
      initialYAML,
      context: itemContext,
      rule: params.rule,
      sources: [{
        context: itemContext,
        xml: params.traversal.xmlNodes?.[0] ?? (params.nameStyle?.explicitXMLName === true
          ? withoutImportableXMLName(params.xml)
          : params.xml),
      }],
      itemName: xmlName ?? canonicalName,
      yamlPath: params.traversal.yamlPath,
      rulePath: enterNestedYamlRule(params.traversal, params.rule.itemType).rulePath,
      collector: params.traversal.collector,
      deferred: params.traversal.deferred,
      dependent: params.traversal.dependent,
      dependencies: params.traversal.dependencies,
      roundTrip: params.traversal.roundTrip,
      audit: params.traversal.audit,
      annotations: params.traversal.annotations,
      mode: params.traversal.mode,
      facts: params.traversal.facts,
      produceResult: params.traversal.produceResult,
      profile: params.traversal.profile,
      execution: propertyExecutionFromTraversal(params.traversal),
    }) ?? initialYAML
  )
  if (explicitName) {
    const keys = Object.keys(yaml)
    arrangeProperties(yaml, keys, [...keys.filter(key => key !== "Имя"), "Имя"])
  }
  return yaml
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
