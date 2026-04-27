import { close, connect, query } from "./internal/connection"
import type { ConnectionOptions } from "./types"

export interface GraphSession {
  query: <R = Record<string, unknown>>(
    cypher: string,
    params?: Record<string, unknown>,
  ) => Promise<R[]>
}

/**
 * Открывает соединение с FalkorDB, передаёт сессию в callback и закрывает.
 * Используется для нескольких Cypher-запросов в рамках одного логического действия
 * (валидация правил, обогащение модели). Соединение закрывается в finally.
 */
export const withGraph = async <T>(
  fn: (graph: GraphSession) => Promise<T>,
  opts?: ConnectionOptions,
): Promise<T> => {
  const conn = await connect(opts)
  try {
    const session: GraphSession = {
      query: async <R>(cypher: string, params?: Record<string, unknown>) =>
        (await query(conn, cypher, params)) as R[],
    }
    return await fn(session)
  } finally {
    await close(conn)
  }
}
