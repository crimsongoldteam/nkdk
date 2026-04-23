import { TSchema } from "@sinclair/typebox"
import { YAMLMap } from "yaml"
import {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "../../context/types"
import { MetadataGraph } from "../../relations/MetadataGraph"
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

export type BuildGraphFromModelFunction = (params: {
  model: unknown
  parentNodeId: string
  filePath: string
  yamlMap: YAMLMap | undefined
  propRule: PropertyRule
  graph: MetadataGraph
  /** Дополнительный контекст, пробрасываемый в кастомные обработчики (например, formNodeId). */
  extra?: Record<string, unknown>
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
  /**
   * Явное имя kind'а для reference-ребра — используется как fallback,
   * если у PropertyRule не задан ни graphEdgeKind, ни yaml.
   * По новому правилу (PRD #114) kind берётся из propRule.graphEdgeKind ?? propRule.yaml.
   */
  name?: string
}

export interface GraphChildRule {
  idFrom: string
  edgeName: string
  /** Необязательный сегмент-дискриминатор типа коллекции, вставляемый в childNodeId. */
  nodeSegment?: string
  itemRule: MetadataItemRule
}

export interface TypeRule {
  importFromXML?: ImportFromXMLFunction
  exportToXML?: ExportToXMLFunction | ExportToXMLFunctionNew
  importFromYAML?: importFromYAMLFunction | ImportFromYAMLFunctionNew
  exportToYAML?: ExportToYAMLFunction | ExportToYAMLFunctionNew
  exportToEnterprise?: ExportToEnterpriseFunction
  exportToJSONSchema?: ExportToJSONSchemaFn
  buildGraphFromModel?: BuildGraphFromModelFunction
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
  | "buildGraphFromModel"
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
            : O extends "buildGraphFromModel"
              ? BuildGraphFromModelFunction | undefined
              : O extends "extractGraph"
                ? ExtractGraphFromModelFunction | undefined
                : O extends "graphEdgeFromParent"
                  ? GraphEdgeFromParent | undefined
                  : O extends "graphChild"
                    ? GraphChildRule | undefined
                    : never
