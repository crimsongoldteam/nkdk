import { PropertyRuleType } from "./registry"
import {
  CollectionItemRule,
  CollectConfigurationIndexFromXMLFunction,
  CollectMetadataTargetReferencesFunction,
  ConfigurationIndexValueFromXMLDescriptor,
  ExportToEnterpriseFunction,
  ExportToJSONSchemaFn,
  ValidationSchemaRefFn,
  ExportToXMLFunction,
  ExportToXMLFunctionNew,
  FinalizeExportedXMLFunction,
  ExportToYAMLFunction,
  ExportToYAMLFunctionNew,
  FileChildNamesDescriptorFunction,
  importExportFunction,
  ImportFromXMLFunction,
  importFromYAMLFunction as ImportFromYAMLFunction,
  ImportFromYAMLFunctionNew,
  MetadataResourceTopologyFunction,
  MetadataTargetOccurrencesFunction,
  StructuralReferencesFunction,
  SyncExternalFromXMLFunction,
  TypeRulesOperations,
  ValidateMetadataTargetFunction,
  XMLImportPropertyBehavior,
} from "./fn"
import type { YAMLToXMLNestedRule } from "./fromYAMLToXMLTypes"
import type {
  CollectLocalFactsFromYAMLFunction,
  FinalizeImportedYAMLFunction,
  ImportFromXMLToYAMLFunction,
  NestedItemIdentityDescriptor,
  NestedItemRule,
  RequiresImportedYAMLFinalizationFunction,
  ResolveNestedImportXMLSourcesFunction,
} from "./importYamlTypes"
import type { PropertyTypeDefinition } from "../definition"
import { currentPropertyRuleRegistrySet } from "./propertyRuleExecutionContext"
import type { YAMLScalarTagPolicy } from "./yamlScalarTagPolicy"

export { definePropertyTypeRule } from "./propertyRuleRegistrySet"

export interface RegisteredTypeRule {
  readonly type: PropertyRuleType
  readonly operation: TypeRulesOperations
  readonly handler: unknown
}

export const registerTypeRule = <O extends TypeRulesOperations>(
  type: PropertyRuleType,
  operation: O,
  ruleFunction: NonNullable<importExportFunction<O>>
) => {
  const registry = currentPropertyRuleRegistrySet<{
    registerTypeRule<Operation extends TypeRulesOperations>(
      propertyType: PropertyRuleType,
      operation: Operation,
      handler: NonNullable<importExportFunction<Operation>>,
    ): void
  }>()
  if (registry === undefined) throw new Error("Не задан execution context property rules")
  registry.registerTypeRule(type, operation, ruleFunction)
}

export const getRegisteredTypeRules = (): readonly RegisteredTypeRule[] => []

export function registerLegacyPropertyTypeDefinitions(
  definitions: Readonly<Record<string, PropertyTypeDefinition>>,
): void {
  for (const [type, definition] of Object.entries(definitions)) {
    for (const [operation, handler] of Object.entries(definition)) {
      registerTypeRule(
        type as PropertyRuleType,
        operation as TypeRulesOperations,
        handler as never,
      )
    }
  }
}

export const getTypeRule = <O extends TypeRulesOperations>(
  type: PropertyRuleType,
  operation: O
): O extends "importFromYAML"
  ? ImportFromYAMLFunction | ImportFromYAMLFunctionNew | undefined
  : O extends "exportToYAML"
    ? ExportToYAMLFunction | ExportToYAMLFunctionNew | undefined
    : O extends "exportToXML"
      ? ExportToXMLFunction | ExportToXMLFunctionNew | undefined
      : O extends "importFromXML"
        ? ImportFromXMLFunction | undefined
        : O extends "importFromXMLToYAML"
          ? ImportFromXMLToYAMLFunction | undefined
          : O extends "exportToEnterprise"
            ? ExportToEnterpriseFunction | undefined
            : O extends "exportToJSONSchema"
              ? ExportToJSONSchemaFn | undefined
              : O extends "validationSchemaRef"
                ? ValidationSchemaRefFn | undefined
                : O extends "collectionItemRule"
                  ? CollectionItemRule | undefined
                  : O extends "syncExternalFromXML"
                    ? SyncExternalFromXMLFunction | undefined
                    : O extends "validateMetadataTarget"
                      ? ValidateMetadataTargetFunction | undefined
                      : O extends "collectMetadataTargetReferences"
                        ? CollectMetadataTargetReferencesFunction | undefined
                        : O extends "structuralReferences"
                          ? StructuralReferencesFunction | undefined
                          : O extends "metadataTargetOccurrences"
                            ? MetadataTargetOccurrencesFunction | undefined
                          : O extends "resourceTopology"
                            ? MetadataResourceTopologyFunction | undefined
                            : O extends "fileChildNamesDescriptor"
                              ? FileChildNamesDescriptorFunction | undefined
                              : O extends "configurationIndexValueFromXML"
                                ? ConfigurationIndexValueFromXMLDescriptor | undefined
                                : O extends "collectConfigurationIndexFromXML"
                                  ? CollectConfigurationIndexFromXMLFunction | undefined
                                  : O extends "xmlImportPropertyBehavior"
                                    ? XMLImportPropertyBehavior | undefined
                                    : O extends "nestedItemIdentity"
                                      ? NestedItemIdentityDescriptor | undefined
                                      : O extends "nestedItemRule"
                                        ? NestedItemRule | undefined
                                        : O extends "resolveNestedImportXMLSources"
                                          ? ResolveNestedImportXMLSourcesFunction | undefined
                                          : O extends "finalizeImportedYAML"
                                            ? FinalizeImportedYAMLFunction | undefined
                                            : O extends "requiresImportedYAMLFinalization"
                                              ? RequiresImportedYAMLFinalizationFunction | undefined
                                              : O extends "finalizeExportedXML"
                                                ? FinalizeExportedXMLFunction | undefined
                                                : O extends "collectLocalFactsFromYAML"
                                                  ? CollectLocalFactsFromYAMLFunction | undefined
                                                  : O extends "yamlToXMLNestedRule"
                                                    ? YAMLToXMLNestedRule | undefined
                                                    : O extends "yamlScalarTagPolicy"
                                                      ? YAMLScalarTagPolicy | undefined
                                                      : never => {
  const contextual = currentPropertyRuleRegistrySet<{
    getTypeRule<Operation extends TypeRulesOperations>(
      propertyType: PropertyRuleType,
      operation: Operation,
    ): importExportFunction<Operation>
  }>()
  const result = contextual?.getTypeRule(type, operation)
  return result as any
}

type ResolvedPropertyItemRule = CollectionItemRule["itemRule"]

interface PropertyWithItemRule {
  type: PropertyRuleType
  itemRule?: ResolvedPropertyItemRule
}

export function resolvePropertyItemRule(
  propertyRule: PropertyWithItemRule,
  fallback?: ResolvedPropertyItemRule
): ResolvedPropertyItemRule | undefined {
  if ("itemRule" in propertyRule && propertyRule.itemRule !== undefined) {
    return propertyRule.itemRule
  }
  return (
    fallback ?? getTypeRule(propertyRule.type, "collectionItemRule")?.itemRule
  )
}

export const typeRulesRegistryRevision = (): number =>
  currentPropertyRuleRegistrySet<{ revision(): number }>()?.revision() ?? 0
