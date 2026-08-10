import {
  registerJSONSchemaIdentity,
  registerJSONSchemaPropertyRef,
} from "../jsonSchemaRefs"
import { registerElementRule } from "../formElement/ruleRegistry"
import type { ElementType } from "../formElement/types"
import type { PropertyRuleType } from "../property/registry"
import { registerLegacyPropertyTypeDefinitions } from "../property/typeRuleRegistry"
import { registerExplicitXMLProperty } from "../property/explicitXMLPropertyRegistry"
import type { MetadataRulesDefinition, MetadataSynchronizationContribution } from "./contracts"

export function registerLegacyRuleDefinitions(
  definition: MetadataRulesDefinition<MetadataSynchronizationContribution, object, object>,
): void {
  registerLegacyPropertyTypeDefinitions(definition.propertyTypes)
  for (const registration of Object.values(
    definition.explicitXMLProperties,
  )) {
    registerExplicitXMLProperty(registration)
  }
  for (const [itemType, rule] of Object.entries(definition.formElements)) {
    registerElementRule(itemType as ElementType, rule)
  }
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
