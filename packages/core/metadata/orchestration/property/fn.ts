import { TSchema } from "@sinclair/typebox"
import { LineCounter, YAMLMap } from "yaml"
import {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "../../context/types"
import type { GraphPrimitive } from "~/metadata/orchestration/buildGraph/types"
import { PropertyRuleType } from "./registry"
import { SourcePosition } from "./position"
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
  lineCounter: LineCounter | undefined
  propRule: PropertyRule
  /** JS-ключ свойства из MetadataItemRule.properties. */
  propertyName: string
  /** Дополнительный контекст, пробрасываемый в кастомные обработчики (например, formNodeId). */
  extra?: Record<string, unknown>
}) => GraphOps | GraphOps[] | undefined | void

export type GraphOpsEdgeProps = Record<string, GraphPrimitive>

export interface GraphOpsChild {
  /**
   * Суффикс относительного id ребёнка. Используется, если не задан absoluteId.
   * При наличии parentOverride: childNodeId = `${parentOverride}.${idSuffix}`.
   * Иначе: childNodeId = `${ctx.parentNodeId}.${idSuffix}`.
   */
  idSuffix: string
  name: string
  positionFrom?: SourcePosition
  /** Порядок owning-ребра внутри коллекции. Если не задан, applyGraphOps ставит индекс по порядку children. */
  index?: number
  /** Запись в node.item при promoteNode. */
  item?: Record<string, unknown>
  /**
   * Если задано — childNodeId = `${parentOverride}.${idSuffix}` вместо
   * `${ctx.parentNodeId}.${idSuffix}`. Источник ребра тоже становится
   * parentOverride, если не задан edgeFrom.
   */
  parentOverride?: string
  /**
   * Если задано — childNodeId = absoluteId полностью (idSuffix/parentOverride
   * для построения id игнорируются; idSuffix остаётся как обязательное поле,
   * и ничто не запрещает absoluteId === `${ctx.parentNodeId}.${idSuffix}` —
   * это просто другая форма записи того же).
   * Используется для плоских узлов в forms/elements:
   * `${formNodeId}.Элемент.<name>`.
   */
  absoluteId?: string
  /**
   * Если задано — источник ребра = edgeFrom. Имеет приоритет над
   * parentOverride и ctx.parentNodeId. Используется для синглетов
   * формы (ContextMenu, AutoCommandBar, ...), где ребро ЭлементФормы
   * идёт от корня формы, а не от визуального родителя.
   */
  edgeFrom?: string
}

export interface GraphOpsReference {
  id: string
  name: string
  positionFrom?: SourcePosition
  /** Дополнительные primitive props конкретного reference-ребра. */
  edgeProps?: GraphOpsEdgeProps
  // parentOverride намеренно не поддерживается: reference создаёт глобальный stub-узел
  // и ребро всегда от ctx.parentNodeId. Если нужен override-источник ребра — используй
  // formLocalReferences (с собственной семантикой резолвинга цели).
}

export interface GraphOpsFormLocalReference {
  /** Form-local путь, например "Объект.Договор.Владелец". */
  formLocalPath: string
  /** Корневой узел формы — стартовая точка резолвинга. */
  formNodeId: string
  positionFrom?: SourcePosition
  /** Если задано — ребро идёт от этого узла к резолвимой цели вместо ctx.parentNodeId. */
  parentOverride?: string
  /** Дополнительные primitive props конкретного reference-ребра. */
  edgeProps?: GraphOpsEdgeProps
  /** Если задано — applyGraphOps создаёт dependency-рёбра от источника к узлам, участвовавшим в разрешении form-local пути. */
  dependsOnEdgeKind?: string
}

export interface GraphOpsRecurse {
  /** Подмодель, для которой нужно повторно вызвать обход правила. */
  model: Record<string, unknown>
  /** YAML-фрагмент подмодели для координат. Опционально. */
  yamlMap?: YAMLMap
  /** Счётчик строк исходного YAML для координат. Опционально. */
  lineCounter?: LineCounter
  /** Правило обхода подмодели. */
  rule: MetadataItemRule
  /** Узел, относительно которого пойдёт обход — становится parentNodeId внутри. */
  parentNodeId: string
  /** Дополнительный контекст, пробрасываемый в обработчики. По умолчанию наследуется от вызывающего. */
  extra?: Record<string, unknown>
}

export interface GraphOps {
  children?: GraphOpsChild[]
  references?: GraphOpsReference[]
  /** Reference-рёбра, цель которых нужно резолвить через resolveFormLocalPath. */
  formLocalReferences?: GraphOpsFormLocalReference[]
  /** Рекурсивные задачи: оркестратор пройдёт по правилу для каждой подмодели после применения локальных ops. */
  recurse?: GraphOpsRecurse[]
  /** ASCII-метка ребра. Передаётся в applyGraphOps оркестратором, когда BuildGraphFromModelFunction возвращает GraphOps вместо мутации graph. */
  edgeKind?: string
  /** Русский YAML-ключ ребра. Передаётся в applyGraphOps. */
  edgeYaml?: string
}

export type ExtractGraphFromModelFunction<TModel = unknown> = (
  model: TModel,
  position?: SourcePosition
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
  referenceName?: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
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
