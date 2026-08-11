import {
  registerJSONSchemaIdentity,
  registerJSONSchemaPropertyRef,
} from "../jsonSchemaRefs"
import { registerElementRule } from "../formElement/ruleRegistry"
import type { ElementType } from "../formElement/types"
import type { PropertyRuleType } from "../property/registry"
import { registerLegacyPropertyTypeDefinitions } from "../property/typeRuleRegistry"
import {
  registerExplicitXMLProperty,
  registerExplicitXMLPropertyType,
} from "../property/explicitXMLPropertyRegistry"
import { declarePropertyItemRule } from "../property/propertyItemRuleDeclarations"
import {
  registerDependentImportItemHandler,
  registerDependentStructuralItemHandler,
  registerDependentYamlItemHandler,
} from "../property/dependentItemRegistry"
import { registerIndexValueFromYAML } from "../property/indexValueFromYAMLRegistry"
import { registerMetadataTargetOwnerResolver } from "../property/metadataTargetOwnerRegistry"
import { registerSystemEnumeration } from "../property/systemEnumerationRegistry"
import type { MetadataRulesDefinition, MetadataSynchronizationContribution } from "./contracts"

export function registerLegacyRuleDefinitions(
  definition: MetadataRulesDefinition<MetadataSynchronizationContribution, object, object>,
): void {
  registerLegacyPropertyTypeDefinitions(definition.propertyTypes)
  for (const [propertyType, itemRule] of Object.entries(
    definition.propertyItemRules,
  )) {
    declarePropertyItemRule(propertyType, itemRule)
  }
  for (const [itemType, handlers] of Object.entries(definition.dependentItems)) {
    if (handlers.yaml !== undefined) {
      registerDependentYamlItemHandler(itemType, handlers.yaml)
    }
    if (handlers.structural !== undefined) {
      registerDependentStructuralItemHandler(itemType, handlers.structural)
    }
    if (handlers.imported !== undefined) {
      registerDependentImportItemHandler(itemType, handlers.imported)
    }
  }
  for (const [propertyType, handler] of Object.entries(
    definition.indexValuesFromYAML,
  )) {
    registerIndexValueFromYAML(propertyType, handler)
  }
  for (const [itemType, resolver] of Object.entries(
    definition.metadataTargetOwners,
  )) {
    registerMetadataTargetOwnerResolver(itemType, resolver)
  }
  for (const [name, enumeration] of Object.entries(
    definition.systemEnumerations,
  )) {
    registerSystemEnumeration(name, enumeration)
  }
  for (const registration of Object.values(
    definition.explicitXMLProperties,
  )) {
    registerExplicitXMLProperty(registration)
  }
  for (const registration of Object.values(
    definition.explicitXMLPropertyTypes,
  )) {
    registerExplicitXMLPropertyType(registration)
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
