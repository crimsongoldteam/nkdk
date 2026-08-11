import {
  registerJSONSchemaIdentity,
  registerJSONSchemaPropertyRef,
} from "../jsonSchemaRefs"
import type { PropertyRuleType } from "../property/registry"
import type { MetadataRulesDefinition } from "./contracts"

export function registerLegacySchemaDefinitions(
  definition: Pick<MetadataRulesDefinition<never>, "schemas" | "schemaPropertyRefs">,
  fallbackSource: object,
): void {
  for (const [name, schema] of Object.entries(definition.schemas)) {
    registerJSONSchemaIdentity({
      name,
      source: schema.source ?? fallbackSource,
      exporter: schema.export,
    })
  }
  for (const [propertyType, factory] of Object.entries(definition.schemaPropertyRefs)) {
    registerJSONSchemaPropertyRef(propertyType as PropertyRuleType, factory)
  }
}
