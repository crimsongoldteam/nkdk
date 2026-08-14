import { getValueOrDefault } from "./helpers"
import type { PropertyRuleRegistrySet } from "./propertyRuleRegistrySet"
import type { PropertyRuleExecution } from "./fn"

export interface PropertyRuleExecutor extends PropertyRuleExecution {}

export function createPropertyRuleExecutor(
  registries: PropertyRuleRegistrySet,
): PropertyRuleExecutor {
  const executor: PropertyRuleExecutor = {
    normalizeImportedBrokenXMLReferences(params) {
      return registries.normalizeImportedBrokenXMLReferences(params)
    },
    prepareBrokenXMLReferenceExport(params) {
      return registries.prepareBrokenXMLReferenceExport(params)
    },
    patchExportedBrokenXMLReferences(params) {
      return registries.patchExportedBrokenXMLReferences(params)
    },
    brokenXMLReferenceValidationSchema(params) {
      return registries.brokenXMLReferenceValidationSchema(params)
    },
    isTransportedBrokenXMLReference(params) {
      return registries.isTransportedBrokenXMLReference(params)
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
    explicitXMLPropertyValidationTag(itemType, propertyKey, propertyType) {
      return registries.explicitXMLPropertyValidationTag(
        itemType,
        propertyKey,
        propertyType,
      )
    },
    validationSchemaRef(params) {
      return registries.getTypeRule(
        params.rule.type,
        "validationSchemaRef",
      )?.(params)
    },
    collectExplicitXMLPropertyActions(params) {
      return registries.collectExplicitXMLPropertyActions(params)
    },
    matchExplicitXMLPropertyFromXML(params) {
      return registries.matchExplicitXMLPropertyFromXML(params)
    },
    matchExplicitXMLPropertyTypeFromXML(params) {
      return registries.matchExplicitXMLPropertyTypeFromXML(params)
    },
    matchExplicitXMLTransportFromXML(params) {
      return registries.matchExplicitXMLTransportFromXML(params)
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
