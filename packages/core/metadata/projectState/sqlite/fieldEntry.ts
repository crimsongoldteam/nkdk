import type { ProjectStateFieldEntry } from "../fileUpdate"
import { decodeOwnerKey, decodeValue } from "./codec"

export interface SqliteProjectStateFieldEntryRow {
  readonly owner_key: string
  readonly field_kind: ProjectStateFieldEntry["kind"]
  readonly field_name: string
  readonly type_key: Uint8Array
  readonly target_name: string | null
  readonly source_collection: string | null
  readonly parent_name: string | null
  readonly table_info: Uint8Array | null
  readonly table_has_columns: number | null
}

export function projectStateFieldEntryFromRow(row: SqliteProjectStateFieldEntryRow): ProjectStateFieldEntry {
  return {
    owner: decodeOwnerKey(row.owner_key),
    kind: row.field_kind,
    name: row.field_name,
    typeInfo: decodeValue(row.type_key),
    ...(row.target_name === null ? {} : { targetName: row.target_name }),
    ...(row.source_collection === null ? {} : { sourceCollection: row.source_collection }),
    ...(row.parent_name === null ? {} : { parentName: row.parent_name }),
    ...(row.table_info === null ? {} : { table: decodeValue(row.table_info) }),
    ...(row.table_has_columns === null ? {} : { tableHasColumns: row.table_has_columns === 1 }),
  }
}
