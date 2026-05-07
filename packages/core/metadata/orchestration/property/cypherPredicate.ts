const cypherSetBrand: unique symbol = Symbol("cypherSet")

/**
 * Множество допустимых значений поля, определяемое Cypher-запросом к FalkorDB.
 *
 * Запрос выполняется оркестратором один раз на скоуп (объект метаданных/форму).
 * Параметр `$scope` — id узла скоупа в графе — подставляется автоматически.
 *
 * По соглашению, первая возвращаемая колонка — множество значений.
 * Используется для валидации YAML и автодополнения в IDE.
 */
export interface CypherSet {
  query: string
}

export const cypherSet = (s: CypherSet): CypherSet => {
  ;(s as unknown as Record<PropertyKey, unknown>)[cypherSetBrand] = true
  return s
}

export const isCypherSet = (value: unknown): value is CypherSet => {
  if (typeof value !== "object" || value === null) return false
  return cypherSetBrand in (value as Record<PropertyKey, unknown>)
}
