import {
  registerJSONSchemaIdentity,
  registerJSONSchemaPropertyRef,
} from "../ruleRuntime/jsonSchemaRefs"
import type { MetadataRulesDefinition } from "../ruleRuntime/definition"
import type { PropertyRuleType } from "../ruleRuntime/property/registry"
import { registerLegacyPropertyTypeDefinitions } from "../ruleRuntime/property/typeRuleRegistry"

export function registerLegacyRuleDefinitions(
  definition: MetadataRulesDefinition,
): void {
  registerLegacyPropertyTypeDefinitions(definition.propertyTypes)
  for (const [name, schema] of Object.entries(definition.schemas)) {
    registerJSONSchemaIdentity({
      name,
      source: schema.source ?? name,
      exporter: schema.export,
    })
  }
  for (const [propertyType, factory] of Object.entries(
    definition.schemaPropertyRefs,
  )) {
    registerJSONSchemaPropertyRef(propertyType as PropertyRuleType, factory)
  }
}
