import { DatabaseSync } from "node:sqlite"
import { afterEach, describe, expect, it } from "vitest"
import { runProjectStateStoreContract } from "../storeContract"
import { createSqliteProjectStateSchema } from "./schema"
import { createSqliteProjectStateStore, type SqliteProjectStateStoreFixture } from "./store"

const compatibility = { formatVersion: 1, coreVersion: "test" }
const fixtures: SqliteProjectStateStoreFixture[] = []

afterEach(() => {
  for (const fixture of fixtures.splice(0)) fixture.store.close()
})

runProjectStateStoreContract(() => fixture())

describe("SQLite ProjectStateStore", () => {
  it("хранит путь и хэш один раз, а дочерние таблицы связывает через source_file_id", () => {
    const database = new DatabaseSync(":memory:")
    try {
      createSqliteProjectStateSchema(database, compatibility, {
        stateId: "schema-test",
        databaseName: "schema-test",
        lifecycleNonce: "schema-test",
      })
      const tables = tableNames(database)
      const columns = new Map(tables.map((table) => [table, tableColumns(database, table)]))

      expect(tables.filter((table) => columns.get(table)!.includes("project_path"))).toEqual(["project_files"])
      expect(tables.filter((table) => columns.get(table)!.includes("hash"))).toEqual(["file_hashes"])

      for (const table of [
        "local_diagnostics",
        "reference_entries",
        "pending_references",
        "owner_facts",
        "field_entries",
        "form_entries",
        "pending_dependency_checks",
        "file_dependencies",
      ]) {
        expect(columns.get(table), table).toContain("source_file_id")
        expect(columns.get(table), table).not.toContain("component_id")
        expect(columns.get(table), table).not.toContain("project_path")
        expect(foreignKeyTargets(database, table), table).toContain("project_files")
      }
    } finally {
      database.close()
    }
  })
})

function fixture(): SqliteProjectStateStoreFixture {
  const result = createSqliteProjectStateStore({ projectDir: "/project", compatibility })
  fixtures.push(result)
  return result
}

function tableNames(database: DatabaseSync): string[] {
  return (database.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[])
    .map(({ name }) => name)
}

function tableColumns(database: DatabaseSync, table: string): string[] {
  return (database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(({ name }) => name)
}

function foreignKeyTargets(database: DatabaseSync, table: string): string[] {
  return (database.prepare(`PRAGMA foreign_key_list(${table})`).all() as { table: string }[]).map((row) => row.table)
}
