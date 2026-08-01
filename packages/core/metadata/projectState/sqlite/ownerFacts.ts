import type { ProjectStateOwnerFacts } from "../fileUpdate"
import { decodeValue } from "./codec"

export interface SqliteOwnerFactValueRow {
  readonly fact_kind: string
  readonly fact_key: string
  readonly fact_value: Uint8Array | null
}

export function projectStateOwnerFactsFromRows(rows: readonly SqliteOwnerFactValueRow[]): ProjectStateOwnerFacts {
  const facts: Record<string, unknown> = {}
  for (const row of rows) {
    if (row.fact_kind === "property" && row.fact_value !== null) facts[row.fact_key] = decodeValue(row.fact_value)
  }
  return facts as ProjectStateOwnerFacts
}
