import { TSchema } from "typebox"
import {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "../../context/types"
import type {
  MetadataTargetConstraint,
  MetadataTargetOwner,
  ParsedMetadataTarget,
  StyleItemTargetType,
} from "../metadataTarget"
import type { Diagnostic } from "../../validation/types"
import type { YamlPath } from "../../validation/yamlLocations"
import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import type { MetadataResourceDeclaration } from "../../resourceTopology/types"
import { PropertyRuleType } from "./registry"
import type {
  CollectLocalFactsFromYAMLFunction,
  FinalizeImportedYAMLFunction,
  ImportFromXMLToYAMLFunction,
  NestedItemIdentityDescriptor,
  NestedItemRule,
  RequiresImportedYAMLFinalizationFunction,
  ResolveNestedImportXMLSourcesFunction,
} from "./importYamlTypes"
import type { MetadataItem, MetadataItemRule, PropertyRule } from "./types"
import type { YAMLToXMLNestedRule } from "./fromYAMLToXMLTypes"
import type { YAMLPropertySource } from "./fromYAMLToXMLTypes"
import type { TypeRulesOperations } from "./ruleContracts"
export type { TypeRulesOperations, YAMLToXMLCondition } from "./ruleContracts"

export type ExportToXMLFunction = (
  context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
  value: any,
  referenceValue?: any
) => any | undefined

export type ExportToXMLFunctionNew = <T extends MetadataItem>(params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  source?: YAMLPropertySource
  propertyKey?: string
  /** @deprecated Удаляется вместе со старой общей XML-оркестрацией. */
  metadataItem?: T
  referenceMetadata?: any
  value: any
}) => any | undefined

export type ImportFromXMLFunction = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  xml: any,
  ownerXmlName?: string
) => any | undefined

export type ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  yaml?: any
  source?: any
  value: any
  name?: string
  owner?: MetadataTargetOwner
  restoreExcludedEqualName?: boolean
}) => any | undefined

export type importFromYAMLFunction = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: any | undefined,
  source?: any
) => any | undefined

export type ExportToYAMLFunction = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: any | undefined
) => any | undefined

export type ExportToYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
  name?: string
  owner?: MetadataTargetOwner
}) => any | undefined

export type ExportToEnterpriseFunction = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any | undefined
}) => any | undefined

export type FinalizeExportedXMLFunction = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: unknown
}) => unknown

export type ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any | undefined
}) => TSchema | undefined

export type ValidationSchemaRefFn = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  schema: TSchema
}) => string | undefined

export type ValidateMetadataTargetFunction = (params: {
  filePath: string
  parsed: ParsedYaml
  yamlPath: YamlPath
  propRule: PropertyRule
  propertyName: string
  value: unknown
  resolver: MetadataTargetValidationResolver
  owner?: MetadataTargetOwner
}) => Diagnostic[]

export interface MetadataTargetValidationResolver {
  resolveObject(params: {
    target: Extract<ParsedMetadataTarget, { kind: "object" }>
    filters?: Extract<MetadataTargetConstraint, { kind: "object" }>["filters"]
  }): MetadataTargetValidationResult
  resolveMember(params: {
    target: Extract<ParsedMetadataTarget, { kind: "member" }>
    filters?: Extract<MetadataTargetConstraint, { kind: "member" }>["filters"]
  }): MetadataTargetValidationResult
  resolveValue(params: { target: Extract<ParsedMetadataTarget, { kind: "value" }> }): MetadataTargetValidationResult
  resolveStyleItem(params: {
    name: string
    expectedTypes: readonly StyleItemTargetType[]
  }): MetadataTargetValidationResult
  resolveCommonPicture(params: { name: string }): MetadataTargetValidationResult
}

export type MetadataTargetValidationResult = { ok: true } | { ok: false; diagnostics: Diagnostic[] }

export interface PendingMetadataTargetReferenceCandidate {
  yamlPath: YamlPath
  canonical: string
  target: ParsedMetadataTarget
  constraint: MetadataTargetConstraint
}

export type CollectMetadataTargetReferencesFunction = (params: {
  filePath: string
  parsed: ParsedYaml
  yamlPath: YamlPath
  propRule: PropertyRule
  propertyName: string
  value: unknown
  owner?: MetadataTargetOwner
}) => {
  references: PendingMetadataTargetReferenceCandidate[]
  diagnostics: Diagnostic[]
}

export interface StructuralReferenceCandidate {
  yamlPath: YamlPath
  canonical: string
  setCanonical(nextCanonical: string): void
}

export type StructuralReferencesFunction = (params: {
  filePath: string
  parsed: ParsedYaml
  yamlPath: YamlPath
  propRule: PropertyRule
  propertyName: string
  value: unknown
  setValue(nextValue: unknown): void
  owner?: MetadataTargetOwner
}) => StructuralReferenceCandidate[]

/**
 * Хендлер для свойств, хранящих значение во внешних файлах (Help.xml, .bsl, формы).
 * Вызывается оркестратором в сторону nkdk — читает XML-сторону и пишет nkdk-сторону.
 * xmlDir и nkdkDir — директории конкретного объекта метаданных (родитель объекта).
 * name — имя самого объекта метаданных, нужно для построения путей к подресурсам объекта (Forms/, Templates/).
 * itemName задаётся при обходе дочерних коллекций (например, команд с функциональными путями).
 */
export type SyncExternalFromXMLFunction = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule
  xmlDir: string
  nkdkDir: string
  name: string
  itemName?: string
}) => Promise<void>

export type MetadataResourceTopologyFunction = (params: {
  propertyRule?: PropertyRule
}) => readonly MetadataResourceDeclaration[]

export interface FileChildNamesDescriptor {
  folderName: string
  xmlFolderName: string
  xmlItemName: string
  useOwnerDirectoryForExternalSync: boolean
  preserveReferenceXmlFolder: boolean
  expectedNames: (params: { rule: MetadataItemRule; yaml: Record<string, unknown>; propertyValue: unknown }) => string[]
}

export type FileChildNamesDescriptorFunction = (params: {
  propertyRule: PropertyRule
}) => FileChildNamesDescriptor | undefined

export interface CollectionItemRule {
  itemRule: MetadataItemRule
}

/**
 * Компактное декларативное описание исходного XML-представления, которое тип
 * теряет при импорте в модель и которое поэтому требуется индексу конфигурации.
 */
export interface ConfigurationIndexValueFromXMLDescriptor {
  identityKind?: "uuid" | "xmlId"
  xsiNilWhenNotRepresentable?: true
  xsiTypeWhenNotRepresentable?: true
  referenceXMLFromValue?: (value: import("../../configurationIndex/types").ConfigurationSnapshotXml) => unknown
}

export type CollectConfigurationIndexFromXMLFunction = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule
  xml: unknown
  propertyKey: string
}) => void

/** Декларативное поведение XML-import, одинаковое для всех свойств зарегистрированного типа. */
export interface XMLImportPropertyBehavior {
  presenceAffectsExport?: true
  presenceAffectsExportForSourceValues?: readonly (string | number | boolean | null)[]
  explicitEmptyValue?: (params: { rule: PropertyRule }) => unknown
}

export interface TypeRule {
  importFromXML?: ImportFromXMLFunction
  importFromXMLToYAML?: ImportFromXMLToYAMLFunction
  exportToXML?: ExportToXMLFunction | ExportToXMLFunctionNew
  importFromYAML?: importFromYAMLFunction | ImportFromYAMLFunctionNew
  exportToYAML?: ExportToYAMLFunction | ExportToYAMLFunctionNew
  exportToEnterprise?: ExportToEnterpriseFunction
  exportToJSONSchema?: ExportToJSONSchemaFn
  validationSchemaRef?: ValidationSchemaRefFn
  collectionItemRule?: CollectionItemRule
  syncExternalFromXML?: SyncExternalFromXMLFunction
  validateMetadataTarget?: ValidateMetadataTargetFunction
  collectMetadataTargetReferences?: CollectMetadataTargetReferencesFunction
  structuralReferences?: StructuralReferencesFunction
  resourceTopology?: MetadataResourceTopologyFunction
  fileChildNamesDescriptor?: FileChildNamesDescriptorFunction
  configurationIndexValueFromXML?: ConfigurationIndexValueFromXMLDescriptor
  collectConfigurationIndexFromXML?: CollectConfigurationIndexFromXMLFunction
  xmlImportPropertyBehavior?: XMLImportPropertyBehavior
  nestedItemIdentity?: NestedItemIdentityDescriptor
  nestedItemRule?: NestedItemRule
  resolveNestedImportXMLSources?: ResolveNestedImportXMLSourcesFunction
  finalizeImportedYAML?: FinalizeImportedYAMLFunction
  requiresImportedYAMLFinalization?: RequiresImportedYAMLFinalizationFunction
  finalizeExportedXML?: FinalizeExportedXMLFunction
  collectLocalFactsFromYAML?: CollectLocalFactsFromYAMLFunction
  yamlToXMLNestedRule?: YAMLToXMLNestedRule
}

type TypeRuleKey = `${PropertyRuleType}:${TypeRulesOperations}`

export const createRegistryKey = (type: PropertyRuleType, operation: TypeRulesOperations): TypeRuleKey => {
  return `${type}:${operation}`
}

export type importExportFunction<O extends TypeRulesOperations> = O extends "importFromYAML"
  ? ImportFromYAMLFunctionNew | importFromYAMLFunction | undefined
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
                                                    : never
