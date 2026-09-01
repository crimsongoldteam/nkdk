import { getValueOrDefault } from "./helpers"
import type { PropertyRuleRegistrySet } from "./propertyRuleRegistrySet"
import {
  compilePropertyPlan,
  type CompiledPropertyPlan,
  type CompiledPropertyRuleExecution,
} from "./compiledPropertyPlan"
import type { CompiledAtomicConversion } from "./atomicConversion"
import type { MetadataItemRule, PropertyRule } from "./types"

export interface PropertyRuleExecutor extends CompiledPropertyRuleExecution {}

export function createPropertyRuleExecutor(
  registries: PropertyRuleRegistrySet,
): PropertyRuleExecutor {
  const plans = new WeakMap<MetadataItemRule, CompiledPropertyPlan>()
  const atomicConversions = new WeakMap<PropertyRule, {
    readonly registryRevision: number
    readonly conversion: CompiledAtomicConversion | undefined
  }>()
  const atomicConversion = (rule: PropertyRule): CompiledAtomicConversion | undefined => {
    const registryRevision = registries.revision()
    const cached = atomicConversions.get(rule)
    if (cached?.registryRevision === registryRevision) return cached.conversion
    const conversion = registries.getTypeRule(rule.type, "compileAtomicConversion")?.({ rule })
    atomicConversions.set(rule, { registryRevision, conversion })
    return conversion
  }
  const executor: PropertyRuleExecutor = {
    propertyPlan(rule) {
      const revision = registries.revision()
      const cached = plans.get(rule)
      if (cached?.registryRevision === revision) return cached
      const compiled = compilePropertyPlan({
        rule,
        registryRevision: revision,
        getTypeRule: (type, operation) => registries.getTypeRule(type, operation),
        isDependentImportProperty: (itemType, propertyKey) =>
          registries.isDependentImportProperty(itemType, propertyKey),
      })
      plans.set(rule, compiled)
      return compiled
    },
    resolveMetadataItemXMLDefaultVariant(params) {
      return registries.resolveMetadataItemXMLDefaultVariant(params)
    },
    applyMetadataItemXmlImportAugmenter(params) {
      registries.applyMetadataItemXmlImportAugmenter(params)
    },
    augmentMetadataItemYamlToXml(params) {
      registries.augmentMetadataItemYamlToXml(params)
    },
    getTypeRule(type, operation) {
      return registries.getTypeRule(type, operation)
    },
    fromXML(params) {
      const { context, rule, value, name, ownerXmlName } = params
      const conversion = atomicConversion(rule)
      if (conversion !== undefined) {
        return getValueOrDefault({
          context,
          rule,
          value: conversion.fromXMLToYAML({ context, value }).metadataValue,
          name,
          operation: "importFromXML",
        })
      }
      const handler = registries.getTypeRule(rule.type, "importFromXML")
      if (handler === undefined) {
        return getValueOrDefault({
          context,
          rule,
          value,
          name,
          operation: "importFromXML",
        })
      }
      return getValueOrDefault({
        context,
        rule,
        value: handler(context, rule, value, ownerXmlName, executor),
        name,
        operation: "importFromXML",
      })
    },
    toJSONSchema(params) {
      return registries.getTypeRule(params.rule.type, "exportToJSONSchema")?.({
        ...params,
        execution: executor,
      })
    },
    resolvePropertyItemRule(rule, fallback) {
      return registries.resolvePropertyItemRule(rule, fallback)
    },
    getDeclaredPropertyItemRule(propertyType) {
      return registries.getDeclaredPropertyItemRule(propertyType)
    },
    getSystemEnumeration(name) {
      return registries.getSystemEnumeration(name)
    },
    validationSchemaRef(params) {
      return registries.getTypeRule(
        params.rule.type,
        "validationSchemaRef",
      )?.(params)
    },
    isDependentImportProperty(itemType, propertyKey) {
      return registries.isDependentImportProperty(itemType, propertyKey)
    },
    getMetadataTargetOwnerResolver(itemType) {
      return registries.getMetadataTargetOwnerResolver(itemType)
    },
  }
  return executor
}
