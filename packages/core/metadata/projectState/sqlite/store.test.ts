import { DatabaseSync } from "node:sqlite"
import { describe, expect, it } from "vitest"
import { runProjectStateStoreContract } from "../storeContract"
import type { ProjectStateYamlFileUpdate } from "../fileUpdate"
import { createSqliteProjectStateSchema } from "./schema"
import { createSqliteProjectStateStoreFromDatabase } from "./store"
import { createSqliteProjectStateTestFixture, sqliteProjectStateTestCompatibility } from "./testFixture"

runProjectStateStoreContract(() => createSqliteProjectStateTestFixture())

describe("SQLite ProjectStateStore", () => {
  it("хранит путь и хэш один раз, а дочерние таблицы связывает через source_file_id", () => {
    const database = new DatabaseSync(":memory:")
    try {
      createSqliteProjectStateSchema(database, sqliteProjectStateTestCompatibility, {
        stateId: "schema-test",
        databaseName: "schema-test",
        lifecycleNonce: "schema-test",
      })
      const tables = tableNames(database)
      const columns = new Map(tables.map((table) => [table, tableColumns(database, table)]))

      expect(tables.filter((table) => columns.get(table)!.includes("project_path"))).toEqual(["project_files"])
      expect(tables.filter((table) => columns.get(table)!.includes("hash"))).toEqual(["file_hashes"])
      expect(columns.get("field_entries")).toEqual([
        "id",
        "source_file_id",
        "ordinal",
        "owner_key",
        "field_kind",
        "field_name",
        "type_key",
        "target_name",
        "source_collection",
        "parent_name",
        "table_info",
        "table_has_columns",
      ])

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

  it("разрешает dependency после заполнения reference-индекса следующей пачкой", () => {
    const database = new DatabaseSync(":memory:")
    const identity = {
      stateId: "dependency-batch-test",
      databaseName: "dependency-batch-test",
      lifecycleNonce: "dependency-batch-test",
    }
    createSqliteProjectStateSchema(database, sqliteProjectStateTestCompatibility, identity)
    database.prepare("INSERT INTO cache_meta(key, value) VALUES ('project_dir', '/project')").run()
    const { store } = createSqliteProjectStateStoreFromDatabase({ database, identity })
    try {
      store.beginUpdate()
      store.replaceFiles({ updates: [yamlUpdate("cf/Источник.yaml", "Catalog.Цель")], hashBytes: new Uint8Array(8) })
      store.replaceFiles({ updates: [yamlUpdate("cf/Цель.yaml", undefined, "Catalog.Цель")], hashBytes: new Uint8Array(8) })

      store.validateDependencies({ requests: [] })

      expect(database.prepare(`
        SELECT target.project_path
        FROM file_dependencies dependency
        LEFT JOIN project_files target ON target.id = dependency.target_file_id
      `).get()).toEqual({ project_path: "cf/Цель.yaml" })
      store.rollbackUpdate()
    } finally {
      store.close()
    }
  })
})

function yamlUpdate(
  projectPath: string,
  dependency?: string,
  reference?: string,
): ProjectStateYamlFileUpdate {
  return {
    kind: "yaml",
    projectPath,
    componentPath: "cf",
    resourceKind: "yaml",
    yamlRole: "configuration",
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    references: reference === undefined ? [] : [{ kind: "object", canonical: reference }],
    pendingReferences: [],
    owners: [],
    fields: [],
    forms: [],
    pendingChecks: [],
    dependencies: dependency === undefined ? [] : [dependency],
  }
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
