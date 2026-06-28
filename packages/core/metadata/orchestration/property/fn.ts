import { TSchema } from "@sinclair/typebox"
import {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "../../context/types"
import type { MetadataTargetOwner } from "~/metadata/commonObjects/metadataTargets"
import type { ProjectMetadataResolver } from "~/metadata/validation/projectMetadataResolver"
import type { Diagnostic } from "~/metadata/validation/types"
import type { YamlPath } from "~/metadata/validation/yamlLocations"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { XmlWriteManifest } from "../xmlWriteManifest"
import { PropertyRuleType } from "./registry"
import { MetadataItem, MetadataItemRule, PropertyRule } from "./types"

export type ExportToXMLFunction = (
  context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
  value: any,
  referenceValue?: any
) => any | undefined

export type ExportToXMLFunctionNew = <T extends MetadataItem>(params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
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

export type ValidateMetadataTargetFunction = (params: {
  filePath: string
  parsed: ParsedYaml
  yamlPath: YamlPath
  propRule: PropertyRule
  propertyName: string
  value: unknown
  resolver: ProjectMetadataResolver
  owner?: MetadataTargetOwner
}) => Diagnostic[]

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

export interface TypeRule {
  importFromXML?: ImportFromXMLFunction
  exportToXML?: ExportToXMLFunction | ExportToXMLFunctionNew
  importFromYAML?: importFromYAMLFunction | ImportFromYAMLFunctionNew
  exportToYAML?: ExportToYAMLFunction | ExportToYAMLFunctionNew
  exportToEnterprise?: ExportToEnterpriseFunction
  exportToJSONSchema?: ExportToJSONSchemaFn
  collectionItemRule?: CollectionItemRule
  syncExternalFromXML?: SyncExternalFromXMLFunction
  syncExternalToXML?: SyncExternalToXMLFunction
  validateMetadataTarget?: ValidateMetadataTargetFunction
  projectResources?: ProjectResourcesFunction
  xmlSyncRoutes?: XmlSyncRoutesFunction
  xmlSyncWriter?: XmlSyncWriterFunction
}

export type TypeRulesOperations =
  | "importFromXML"
  | "exportToXML"
  | "importFromYAML"
  | "exportToYAML"
  | "exportToEnterprise"
  | "exportToJSONSchema"
  | "collectionItemRule"
  | "syncExternalFromXML"
  | "syncExternalToXML"
  | "validateMetadataTarget"
  | "projectResources"
  | "xmlSyncRoutes"
  | "xmlSyncWriter"
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
        : O extends "exportToEnterprise"
      ? ExportToEnterpriseFunction | undefined
      : O extends "exportToJSONSchema"
        ? ExportToJSONSchemaFn | undefined
          : O extends "collectionItemRule"
            ? CollectionItemRule | undefined
            : O extends "syncExternalFromXML"
              ? SyncExternalFromXMLFunction | undefined
              : O extends "syncExternalToXML"
                ? SyncExternalToXMLFunction | undefined
                : O extends "validateMetadataTarget"
                  ? ValidateMetadataTargetFunction | undefined
                  : O extends "projectResources"
                    ? ProjectResourcesFunction | undefined
                    : O extends "xmlSyncRoutes"
                      ? XmlSyncRoutesFunction | undefined
                      : O extends "xmlSyncWriter"
                        ? XmlSyncWriterFunction | undefined
                        : never
