import { PropertyRuleType } from "./registry"
import {
  CollectionItemRule,
  CollectConfigurationIndexFromXMLFunction,
  CollectMetadataTargetReferencesFunction,
  ConfigurationIndexValueFromXMLDescriptor,
  createRegistryKey,
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

const typeRulesRegistry = new Map<
  string,
  | ImportFromYAMLFunction
  | ExportToYAMLFunction
  | ImportFromXMLFunction
  | ExportToXMLFunction
  | ExportToEnterpriseFunction
  | ExportToJSONSchemaFn
  | ValidationSchemaRefFn
  | ExportToXMLFunctionNew
  | ImportFromYAMLFunctionNew
  | ExportToYAMLFunctionNew
  | CollectionItemRule
  | SyncExternalFromXMLFunction
  | ValidateMetadataTargetFunction
  | CollectMetadataTargetReferencesFunction
  | StructuralReferencesFunction
  | MetadataResourceTopologyFunction
  | FileChildNamesDescriptorFunction
  | ConfigurationIndexValueFromXMLDescriptor
  | CollectConfigurationIndexFromXMLFunction
  | XMLImportPropertyBehavior
  | ImportFromXMLToYAMLFunction
  | NestedItemRule
  | ResolveNestedImportXMLSourcesFunction
  | FinalizeImportedYAMLFunction
  | RequiresImportedYAMLFinalizationFunction
  | FinalizeExportedXMLFunction
  | CollectLocalFactsFromYAMLFunction
  | NestedItemIdentityDescriptor
  | YAMLToXMLNestedRule
>()
const typeRuleRegistrations = new Map<string, RegisteredTypeRule>()
const coreRegistrationKeysByHandler = new WeakMap<object, Set<string>>()
let registryRevision = 0

export interface RegisteredTypeRule {
  readonly type: PropertyRuleType
  readonly operation: TypeRulesOperations
  readonly handler: unknown
  readonly coreRegistrationKeys?: readonly string[]
}

export const registerTypeRule = <O extends TypeRulesOperations>(
  type: PropertyRuleType,
  operation: O,
  ruleFunction: NonNullable<importExportFunction<O>>
) => {
  const key = createRegistryKey(type, operation)
  typeRulesRegistry.set(key, ruleFunction)
  typeRuleRegistrations.set(key, { type, operation, handler: ruleFunction })
  registryRevision += 1
}

export const getRegisteredTypeRules = (): readonly RegisteredTypeRule[] => [...typeRuleRegistrations].map(([, registration]) => {
  const handler = asWeakKey(registration.handler)
  const coreRegistrationKeys = handler === undefined ? undefined : coreRegistrationKeysByHandler.get(handler)
  return {
    ...registration,
    ...(coreRegistrationKeys === undefined
      ? {}
      : { coreRegistrationKeys: [...coreRegistrationKeys].sort(compareCodePoints) }),
  }
})

export const markRegisteredTypeRulesAsCoreForCompatibility = (): void => {
  for (const [key, registration] of typeRuleRegistrations) markHandlerRegistrationAsCore(registration.handler, key)
}

export const markTypeRuleAsCoreForCompatibility = (
  type: PropertyRuleType,
  operation: TypeRulesOperations,
): void => {
  const key = createRegistryKey(type, operation)
  const registration = typeRuleRegistrations.get(key)
  if (registration !== undefined) markHandlerRegistrationAsCore(registration.handler, key)
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
                                                    : never => {
  const key = createRegistryKey(type, operation)
  const result = typeRulesRegistry.get(key)
  return result as any
}

export const clearTypeRulesRegistry = (): void => {
  typeRulesRegistry.clear()
  typeRuleRegistrations.clear()
  registryRevision += 1
}

function markHandlerRegistrationAsCore(handler: unknown, key: string): void {
  const weakKey = asWeakKey(handler)
  if (weakKey === undefined) return
  const keys = coreRegistrationKeysByHandler.get(weakKey) ?? new Set<string>()
  keys.add(key)
  coreRegistrationKeysByHandler.set(weakKey, keys)
}

function asWeakKey(value: unknown): object | undefined {
  return (typeof value === "object" && value !== null) || typeof value === "function"
    ? value as object
    : undefined
}

function compareCodePoints(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

export const typeRulesRegistryRevision = (): number => registryRevision
