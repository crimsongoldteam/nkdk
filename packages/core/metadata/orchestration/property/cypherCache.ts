/**
 * Синхронный кеш результатов Cypher-запросов.
 *
 * Заполняется асинхронно до начала обхода свойств toXML
 * и читается синхронно внутри shouldProcessProperty.
 */
export class CypherCache {
  private readonly store = new Map<string, Record<string, unknown>[]>()

  set(key: string, rows: Record<string, unknown>[]): void {
    this.store.set(key, rows)
  }

  get(key: string): Record<string, unknown>[] | undefined {
    return this.store.get(key)
  }
}
