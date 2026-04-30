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

type BrandedCypherPredicate = CypherPredicate & { readonly [cypherPredicateBrand]: true }

export const cypherPredicate = (p: CypherPredicate): CypherPredicate => {
  ;(p as BrandedCypherPredicate)[cypherPredicateBrand as unknown as keyof BrandedCypherPredicate] = true
  return p
}

export const isCypherPredicate = (value: unknown): value is CypherPredicate => {
  if (typeof value !== "object" || value === null) return false
  return cypherPredicateBrand in (value as Record<PropertyKey, unknown>)
}
