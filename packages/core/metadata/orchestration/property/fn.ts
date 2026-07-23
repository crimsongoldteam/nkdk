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
} from "../../commonObjects/metadataTargets"
import type { Diagnostic } from "../../validation/types"
import type { YamlPath } from "../../validation/yamlLocations"
import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import type { XmlWriteManifest } from "../xmlWriteManifest"
import type { XmlImportRoute } from "../../importFromXml/types"
import { PropertyRuleType } from "./registry"
import type {
  CollectLocalFactsFromYAMLFunction,
  FinalizeImportedYAMLFunction,
  ImportFromXMLToYAMLFunction,
  NestedItemRule,
  ResolveNestedImportXMLSourcesFunction,
} from "./importYamlTypes"
import type { MetadataItem, MetadataItemRule, PropertyRule } from "./types"
import type { YAMLToXMLNestedRule } from "./fromYAMLToXMLTypes"
import type { YAMLPropertySource } from "./fromYAMLToXMLTypes"

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

export type YAMLToXMLCondition = (source: YAMLPropertySource, context?: ConfigurationContextWithExportToXML) => boolean

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

/**
 * Хендлер для свойств, хранящих значение во внешних файлах (Help.xml, .bsl, формы).
 * Вызывается оркестратором в сторону XML — читает nkdk-сторону и пишет XML-сторону.
 * referenceDir — родитель эталонной директории объекта; используется для round-trip в свойствах,
 * которые читают эталонный XML (например, формы). Опциональное поле.
 */
export type SyncExternalToXMLFunction = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  nkdkDir: string
  xmlDir: string
  name: string
  referenceDir?: string
  referenceName?: string
  propertyValue?: unknown
  referencePropertyValue?: unknown
  xmlManifest?: XmlWriteManifest
  itemName?: string
  currentXMLDir?: string
}) => Promise<void>

export type ProjectResourceCompositionImpact = "none" | "configurationComposition"

export type ProjectResourceSource =
  | { kind: "itemRule"; itemType: string }
  | { kind: "property"; propertyName: string; propertyType: PropertyRuleType }
  | { kind: "propertyType"; type: PropertyRuleType }

export type ProjectResourceDescriptor =
  | {
      kind: "yaml"
      role: "configuration" | "properties" | "fileItem" | "resourceOnly"
      projectPattern: string
      required: boolean
      repeatable: boolean
      owner: "configuration" | "currentItem"
      compositionImpact: ProjectResourceCompositionImpact
      source: ProjectResourceSource
      itemType?: string
    }
  | {
      kind: "directory"
      role: "resourceOnly"
      projectPattern: string
      required: boolean
      repeatable: boolean
      owner: "currentItem"
      compositionImpact: "none"
      source: ProjectResourceSource
    }

export type XmlSyncRoute =
  | {
      kind: "owner"
      yamlPattern: string
      xmlPathPattern: string
      source: ProjectResourceSource
    }
  | {
      kind: "fileItem" | "externalFile"
      yamlPattern: string
      xmlPathPattern: string
      writerType: "propertyType"
      source: ProjectResourceSource
      dumpInfoNamePatterns?: string[]
      deleteParentAreaBeforeWrite?: boolean
    }
  | {
      kind: "resourceOnly"
      yamlPattern: string
      source: ProjectResourceSource
    }

export type ProjectResourcesFunction = (params: { propertyRule?: PropertyRule }) => ProjectResourceDescriptor[]
export type XmlSyncRoutesFunction = (params: { propertyRule?: PropertyRule }) => XmlSyncRoute[]
export type XmlImportRoutesFunction = (params: { propertyRule?: PropertyRule }) => readonly XmlImportRoute[]

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

export type XmlSyncWriterFunction = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  nkdkDir: string
  xmlDir: string
  name: string
  itemName?: string
  referenceDir?: string
  xmlManifest?: XmlWriteManifest
}) => Promise<void>

export interface CollectionItemRule {
  itemRule: MetadataItemRule
}

/**
 * Компактное декларативное описание исходного XML-представления, которое тип
 * теряет при импорте в модель и которое поэтому требуется индексу конфигурации.
 */
export interface ConfigurationIndexValueFromXMLDescriptor {
  userSettingsIdFromSource?: true
  xsiNilWhenNotRepresentable?: true
}

/** Декларативное поведение XML-import, одинаковое для всех свойств зарегистрированного типа. */
export interface XMLImportPropertyBehavior {
  presenceAffectsExportForSourceValues?: readonly (string | number | boolean | null)[]
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
  syncExternalToXML?: SyncExternalToXMLFunction
  validateMetadataTarget?: ValidateMetadataTargetFunction
  collectMetadataTargetReferences?: CollectMetadataTargetReferencesFunction
  structuralReferences?: StructuralReferencesFunction
  projectResources?: ProjectResourcesFunction
  xmlSyncRoutes?: XmlSyncRoutesFunction
  xmlImportRoutes?: XmlImportRoutesFunction
  fileChildNamesDescriptor?: FileChildNamesDescriptorFunction
  xmlSyncWriter?: XmlSyncWriterFunction
  configurationIndexValueFromXML?: ConfigurationIndexValueFromXMLDescriptor
  xmlImportPropertyBehavior?: XMLImportPropertyBehavior
  nestedItemRule?: NestedItemRule
  resolveNestedImportXMLSources?: ResolveNestedImportXMLSourcesFunction
  finalizeImportedYAML?: FinalizeImportedYAMLFunction
  collectLocalFactsFromYAML?: CollectLocalFactsFromYAMLFunction
  yamlToXMLNestedRule?: YAMLToXMLNestedRule
}

export type TypeRulesOperations =
  | "importFromXML"
  | "importFromXMLToYAML"
  | "exportToXML"
  | "importFromYAML"
  | "exportToYAML"
  | "exportToEnterprise"
  | "exportToJSONSchema"
  | "validationSchemaRef"
  | "collectionItemRule"
  | "syncExternalFromXML"
  | "syncExternalToXML"
  | "validateMetadataTarget"
  | "collectMetadataTargetReferences"
  | "structuralReferences"
  | "projectResources"
  | "xmlSyncRoutes"
  | "xmlImportRoutes"
  | "fileChildNamesDescriptor"
  | "xmlSyncWriter"
  | "configurationIndexValueFromXML"
  | "xmlImportPropertyBehavior"
  | "nestedItemRule"
  | "resolveNestedImportXMLSources"
  | "finalizeImportedYAML"
  | "collectLocalFactsFromYAML"
  | "yamlToXMLNestedRule"
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
                    : O extends "syncExternalToXML"
                      ? SyncExternalToXMLFunction | undefined
                      : O extends "validateMetadataTarget"
                        ? ValidateMetadataTargetFunction | undefined
                        : O extends "collectMetadataTargetReferences"
                          ? CollectMetadataTargetReferencesFunction | undefined
                          : O extends "structuralReferences"
                            ? StructuralReferencesFunction | undefined
                            : O extends "projectResources"
                              ? ProjectResourcesFunction | undefined
                              : O extends "xmlSyncRoutes"
                                ? XmlSyncRoutesFunction | undefined
                                : O extends "xmlImportRoutes"
                                  ? XmlImportRoutesFunction | undefined
                                  : O extends "fileChildNamesDescriptor"
                                    ? FileChildNamesDescriptorFunction | undefined
                                    : O extends "xmlSyncWriter"
                                      ? XmlSyncWriterFunction | undefined
                                      : O extends "configurationIndexValueFromXML"
                                        ? ConfigurationIndexValueFromXMLDescriptor | undefined
                                        : O extends "xmlImportPropertyBehavior"
                                          ? XMLImportPropertyBehavior | undefined
                                          : O extends "nestedItemRule"
                                            ? NestedItemRule | undefined
                                            : O extends "resolveNestedImportXMLSources"
                                              ? ResolveNestedImportXMLSourcesFunction | undefined
                                              : O extends "finalizeImportedYAML"
                                                ? FinalizeImportedYAMLFunction | undefined
                                                : O extends "collectLocalFactsFromYAML"
                                                  ? CollectLocalFactsFromYAMLFunction | undefined
                                                  : O extends "yamlToXMLNestedRule"
                                                    ? YAMLToXMLNestedRule | undefined
                                                    : never
