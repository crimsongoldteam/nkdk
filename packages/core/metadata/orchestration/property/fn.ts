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
}) => GraphOps | GraphOps[] | undefined | void

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

export interface GraphOpsFormLocalReference {
  /** Form-local путь, например "Объект.Договор.Владелец". */
  formLocalPath: string
  /** Корневой узел формы — стартовая точка резолвинга. */
  formNodeId: string
  positionFrom?: { offset: number; length?: number }
}

export interface GraphOps {
  children?: GraphOpsChild[]
  references?: GraphOpsReference[]
  /** Reference-рёбра, цель которых нужно резолвить через resolveFormLocalPath. */
  formLocalReferences?: GraphOpsFormLocalReference[]
  /** ASCII-метка ребра. Передаётся в applyGraphOps оркестратором, когда BuildGraphFromModelFunction возвращает GraphOps вместо мутации graph. */
  edgeKind?: string
  /** Русский YAML-ключ ребра. Передаётся в applyGraphOps. */
  edgeYaml?: string
}

export type ExtractGraphFromModelFunction<TModel = unknown> = (
  model: TModel,
  position?: { offset: number; length?: number }
) => GraphOps | undefined

export type GraphEdgeFromParent = {
  /**
   * ASCII-метка kind'а для reference-ребра — используется как fallback,
   * если у PropertyRule не задан graphEdgeKind. SCREAMING_SNAKE_CASE.
   */
  kind?: string
  /**
   * Русский YAML-ключ для ребра — используется как fallback для поля yaml,
   * если у PropertyRule не задан yaml.
   */
  yaml?: string
}

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
  itemName?: string
}) => Promise<void>

export interface GraphChildRule {
  idFrom: string
  /** ASCII-метка kind'а ребра (тип отношения в Cypher). SCREAMING_SNAKE_CASE. */
  edgeKind: string
  /** Русский YAML-ключ ребра (для round-trip). */
  edgeYaml: string
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
  syncExternalFromXML?: SyncExternalFromXMLFunction
  syncExternalToXML?: SyncExternalToXMLFunction
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
  | "syncExternalFromXML"
  | "syncExternalToXML"
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
                    : O extends "syncExternalFromXML"
                      ? SyncExternalFromXMLFunction | undefined
                      : O extends "syncExternalToXML"
                        ? SyncExternalToXMLFunction | undefined
                        : never
