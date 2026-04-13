import type { MetadataGraph } from "./MetadataGraph"

// ---------------------------------------------------------------------------
// Named filter predicates
// ---------------------------------------------------------------------------

export type FilterName = "stringIndexedAttribute"

type FilterPredicate = (item: unknown) => boolean

/**
 * Именованные фильтры-предикаты для referenceScope.
 * Ключ — имя фильтра, значение — функция-предикат по item узла графа.
 */
export const namedFilters: Record<FilterName, FilterPredicate> = {
  /**
   * Реквизит с индексированием: используется для ВводПоСтроке.
   * Проходит MetadataAttribute с indexing: "Index" | "IndexWithAdditionalOrder".
   */
  stringIndexedAttribute: (item: unknown): boolean => {
    if (!item || typeof item !== "object") return false
    const attr = item as Record<string, unknown>
    if (attr.itemType !== "MetadataAttribute") return false
    return attr.indexing === "Index" || attr.indexing === "IndexWithAdditionalOrder"
  },
}

// ---------------------------------------------------------------------------
// ReferenceScope types
// ---------------------------------------------------------------------------

/** Ссылка на объект текущего объекта-владельца (target: "this"). */
export type ReferenceScopeThis =
  | { target: "this"; kind: "Form" }
  | { target: "this"; kind: "Attribute"; filter?: FilterName }

/** Ссылка на top-level объект одного из допустимых типов. */
export type ReferenceScopeTopLevel = {
  target: "topLevel"
  /** Допустимые префиксы типов, например ["Справочник", "Документ"]. */
  allowedTypes: string[]
}

export type ReferenceScope = ReferenceScopeThis | ReferenceScopeTopLevel

// ---------------------------------------------------------------------------
// Validation API
// ---------------------------------------------------------------------------

/**
 * Проверяет, является ли целевой узел допустимой ссылкой для данного scope.
 *
 * @param targetNodeId - Полный nodeId в графе (например, "Справочник.Контрагенты")
 * @param scope        - Описание допустимых целей ссылки
 * @param graph        - Экземпляр MetadataGraph
 * @param ownerNodeId  - NodeId объекта-владельца (например, "Справочник.МойСправочник")
 */
export function validateReferenceScope(
  targetNodeId: string,
  scope: ReferenceScope,
  graph: MetadataGraph,
  ownerNodeId: string,
): boolean {
  if (scope.target === "topLevel") {
    const parts = targetNodeId.split(".")
    // Top-level: ровно один уровень вложенности (Тип.Имя)
    if (parts.length !== 2) return false
    return scope.allowedTypes.includes(parts[0])
  }

  if (scope.target === "this") {
    // Цель должна быть прямым composition-потомком объекта-владельца
    let isDirectChild = false
    for (const { target, attributes } of graph.outEdgeEntries(ownerNodeId)) {
      if (target === targetNodeId && attributes.kind === "composition") {
        isDirectChild = true
        break
      }
    }
    if (!isDirectChild) return false

    const item = graph.getNodeAttribute(targetNodeId, "item")
    // Узел-заглушка — item отсутствует
    if (item === undefined) return false

    const attr = item as Record<string, unknown>

    if (scope.kind === "Form") {
      return attr.itemType === "ClientApplicationForm"
    }

    if (scope.kind === "Attribute") {
      if (attr.itemType !== "MetadataAttribute") return false
      if (scope.filter) {
        return namedFilters[scope.filter](item)
      }
      return true
    }
  }

  return false
}
