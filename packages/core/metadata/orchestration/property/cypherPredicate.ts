const cypherPredicateBrand: unique symbol = Symbol("cypherPredicate")

/**
 * Условие экспорта свойства в XML на основе Cypher-запроса к FalkorDB.
 *
 * Запрос выполняется оркестратором один раз на скоуп (объект метаданных/форму)
 * до начала обхода свойств. Параметр `$scope` — id узла скоупа в графе —
 * подставляется автоматически. Результат кешируется.
 *
 * Функция `test` вызывается синхронно для каждого экземпляра элемента
 * (носителя свойства) и возвращает `true`, если свойство нужно экспортировать.
 */
export interface CypherPredicate {
  /** Cypher-запрос. Параметр `$scope` заполняется оркестратором автоматически. */
  query: string
  /**
   * Проверяет, применимо ли условие к конкретному элементу.
   * @param metadataItem — модель элемента, владеющего свойством.
   * @param rows — строки результата Cypher-запроса (уже выполнены и закешированы).
   */
  test: (metadataItem: unknown, rows: Record<string, unknown>[]) => boolean
}

export const cypherPredicate = (p: CypherPredicate): CypherPredicate => {
  ;(p as unknown as Record<PropertyKey, unknown>)[cypherPredicateBrand] = true
  return p
}

export const isCypherPredicate = (value: unknown): value is CypherPredicate => {
  if (typeof value !== "object" || value === null) return false
  return cypherPredicateBrand in (value as Record<PropertyKey, unknown>)
}

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
