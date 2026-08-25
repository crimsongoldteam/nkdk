import { getValueOrDefault } from "./helpers"
import type { PropertyRuleRegistrySet } from "./propertyRuleRegistrySet"
import type { PropertyRuleExecution } from "./fn"

export interface PropertyRuleExecutor extends PropertyRuleExecution {}

export function createPropertyRuleExecutor(
  registries: PropertyRuleRegistrySet,
): PropertyRuleExecutor {
  const executor: PropertyRuleExecutor = {
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
