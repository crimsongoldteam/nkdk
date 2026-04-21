import { TSchema } from "@sinclair/typebox"
import { YAMLMap } from "yaml"
import {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "../../context/types"
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
  xml: any
) => any | undefined

export type ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  yaml?: any
  source?: any
  value: any
  name?: string
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

export type ImportDependenciesFromYAMLFunction = (params: {
  context: ConfigurationContext
  yamlMap?: YAMLMap
  parentNodeId: string
  filePath: string
  propRule?: PropertyRule
  parsedItem?: unknown
}) => void

export interface GraphOpsChild {
  idSuffix: string
  name: string
  positionFrom?: { offset: number; length?: number }
}

export interface GraphOpsReference {
  id: string
  name: string
  positionFrom?: { offset: number; length?: number }
}

export interface GraphOps {
  children?: GraphOpsChild[]
  references?: GraphOpsReference[]
}

export type ExtractGraphFromModelFunction<TModel = unknown> = (
  model: TModel,
  position?: { offset: number; length?: number }
) => GraphOps | undefined

export type GraphEdgeFromParent = {
  name: string
  kind: "composition" | "reference"
}

export interface GraphChildRule {
  idFrom: string
  edgeName: string
  edgeKind: "composition" | "reference"
  itemRule: MetadataItemRule
}

export interface TypeRule {
  importFromXML?: ImportFromXMLFunction
  exportToXML?: ExportToXMLFunction | ExportToXMLFunctionNew
  importFromYAML?: importFromYAMLFunction | ImportFromYAMLFunctionNew
  exportToYAML?: ExportToYAMLFunction | ExportToYAMLFunctionNew
  exportToEnterprise?: ExportToEnterpriseFunction
  exportToJSONSchema?: ExportToJSONSchemaFn
  importDependenciesFromYAML?: ImportDependenciesFromYAMLFunction
  extractGraph?: ExtractGraphFromModelFunction
  graphEdgeFromParent?: GraphEdgeFromParent
  graphChild?: GraphChildRule
}

export type TypeRulesOperations =
  | "importFromXML"
  | "exportToXML"
  | "importFromYAML"
  | "exportToYAML"
  | "exportToEnterprise"
  | "exportToJSONSchema"
  | "importDependenciesFromYAML"
  | "extractGraph"
  | "graphEdgeFromParent"
  | "graphChild"
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
            : O extends "importDependenciesFromYAML"
              ? ImportDependenciesFromYAMLFunction | undefined
              : O extends "extractGraph"
                ? ExtractGraphFromModelFunction | undefined
                : O extends "graphEdgeFromParent"
                  ? GraphEdgeFromParent | undefined
                  : O extends "graphChild"
                    ? GraphChildRule | undefined
                    : never
