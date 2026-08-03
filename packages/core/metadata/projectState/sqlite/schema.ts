import type { DatabaseSync } from "node:sqlite"
import type { ProjectStateCompatibility } from "../compatibility"
import type { SqliteProjectStateIdentity } from "./readToken"

export function createSqliteProjectStateSchema(
  database: DatabaseSync,
  compatibility: ProjectStateCompatibility,
  identity: SqliteProjectStateIdentity,
): void {
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = MEMORY;
    PRAGMA synchronous = NORMAL;
    BEGIN IMMEDIATE;

    CREATE TABLE cache_meta (
      key TEXT PRIMARY KEY COLLATE BINARY,
      value TEXT NOT NULL
    ) STRICT;

    CREATE TABLE read_token_claims (
      token_nonce TEXT PRIMARY KEY COLLATE BINARY
    ) STRICT;

    CREATE TABLE components (
      id INTEGER PRIMARY KEY,
      path TEXT NOT NULL UNIQUE COLLATE BINARY
    ) STRICT;

    CREATE TABLE project_files (
      id INTEGER PRIMARY KEY,
      project_path TEXT NOT NULL UNIQUE COLLATE BINARY,
      component_id INTEGER NOT NULL REFERENCES components(id),
      resource_kind TEXT NOT NULL,
      yaml_role TEXT
    ) STRICT;

    CREATE TABLE file_hashes (
      file_id INTEGER PRIMARY KEY REFERENCES project_files(id) ON DELETE CASCADE,
      hash BLOB NOT NULL CHECK(length(hash) = 8)
    ) STRICT;

    CREATE TABLE file_validation_results (
      file_id INTEGER PRIMARY KEY REFERENCES project_files(id) ON DELETE CASCADE,
      checked INTEGER NOT NULL CHECK(checked IN (0, 1)),
      schema_ready INTEGER NOT NULL CHECK(schema_ready IN (0, 1)),
      contributed_facts INTEGER NOT NULL CHECK(contributed_facts IN (0, 1))
    ) STRICT;

    CREATE TABLE local_diagnostics (
      id INTEGER PRIMARY KEY,
      source_file_id INTEGER NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
      diagnostic_kind TEXT NOT NULL,
      ordinal INTEGER NOT NULL,
      severity TEXT NOT NULL,
      source TEXT NOT NULL,
      message TEXT NOT NULL,
      line INTEGER NOT NULL,
      col INTEGER NOT NULL,
      yaml_path TEXT
    ) STRICT;

    CREATE TABLE reference_entries (
      id INTEGER PRIMARY KEY,
      source_file_id INTEGER NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
      ordinal INTEGER NOT NULL,
      entry_kind TEXT NOT NULL,
      canonical_key TEXT NOT NULL COLLATE BINARY,
      owner_key TEXT COLLATE BINARY,
      member_key TEXT COLLATE BINARY,
      value_key TEXT COLLATE BINARY,
      details_value BLOB,
      yaml_path TEXT
    ) STRICT;

    CREATE TABLE pending_references (
      id INTEGER PRIMARY KEY,
      source_file_id INTEGER NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
      ordinal INTEGER NOT NULL,
      canonical_target TEXT NOT NULL COLLATE BINARY,
      filter_kind TEXT NOT NULL,
      filter_value BLOB NOT NULL,
      line INTEGER,
      col INTEGER,
      yaml_path TEXT NOT NULL
    ) STRICT;

    CREATE TABLE owner_facts (
      id INTEGER PRIMARY KEY,
      source_file_id INTEGER NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
      ordinal INTEGER NOT NULL,
      owner_key TEXT NOT NULL COLLATE BINARY,
      fact_kind TEXT NOT NULL,
      fact_key TEXT NOT NULL COLLATE BINARY,
      fact_value BLOB
    ) STRICT;

    CREATE TABLE field_entries (
      id INTEGER PRIMARY KEY,
      source_file_id INTEGER NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
      ordinal INTEGER NOT NULL,
      owner_key TEXT NOT NULL COLLATE BINARY,
      field_kind TEXT NOT NULL,
      field_name TEXT NOT NULL COLLATE BINARY,
      type_key BLOB NOT NULL,
      target_name TEXT,
      source_collection TEXT,
      parent_name TEXT,
      table_info BLOB,
      table_has_columns INTEGER CHECK(table_has_columns IN (0, 1))
    ) STRICT;

    CREATE TABLE form_entries (
      id INTEGER PRIMARY KEY,
      source_file_id INTEGER NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
      ordinal INTEGER NOT NULL,
      owner_key TEXT NOT NULL COLLATE BINARY,
      form_key TEXT NOT NULL COLLATE BINARY,
      source_kind TEXT NOT NULL,
      source_value BLOB NOT NULL
    ) STRICT;

    CREATE TABLE pending_dependency_checks (
      id INTEGER PRIMARY KEY,
      source_file_id INTEGER NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
      ordinal INTEGER NOT NULL,
      check_kind TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      line INTEGER NOT NULL,
      col INTEGER NOT NULL,
      yaml_path TEXT
    ) STRICT;

    CREATE TABLE file_dependencies (
      source_file_id INTEGER NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
      target_file_id INTEGER REFERENCES project_files(id) ON DELETE SET NULL,
      ordinal INTEGER NOT NULL,
      dependency_kind TEXT NOT NULL,
      dependency_key TEXT NOT NULL COLLATE BINARY,
      PRIMARY KEY(source_file_id, dependency_kind, dependency_key)
    ) STRICT;

    CREATE INDEX project_files_component ON project_files(component_id, id);
    CREATE INDEX diagnostics_file_order ON local_diagnostics(source_file_id, diagnostic_kind, ordinal);
    CREATE INDEX reference_lookup ON reference_entries(canonical_key, source_file_id);
    CREATE INDEX reference_source ON reference_entries(source_file_id);
    CREATE INDEX pending_reference_source ON pending_references(source_file_id);
    CREATE INDEX owner_lookup ON owner_facts(owner_key, source_file_id);
    CREATE INDEX owner_source ON owner_facts(source_file_id);
    CREATE INDEX field_owner_lookup ON field_entries(owner_key, source_file_id);
    CREATE INDEX field_source ON field_entries(source_file_id);
    CREATE INDEX form_owner_lookup ON form_entries(owner_key, source_file_id);
    CREATE INDEX form_source ON form_entries(source_file_id);
    CREATE INDEX pending_check_source ON pending_dependency_checks(source_file_id);
    CREATE INDEX dependency_target_lookup ON file_dependencies(target_file_id, source_file_id);
  `)
  const insertMeta = database.prepare("INSERT INTO cache_meta(key, value) VALUES (?, ?)")
  try {
    insertMeta.run("schema_version", String(compatibility.schemaVersion))
    insertMeta.run("producer_version", compatibility.producerVersion)
    insertMeta.run("rules_fingerprint", compatibility.rulesFingerprint)
    insertMeta.run("hash_algorithm", compatibility.hashAlgorithm)
    insertMeta.run("state_id", identity.stateId)
    insertMeta.run("database_name", identity.databaseName)
    insertMeta.run("lifecycle_nonce", identity.lifecycleNonce)
    database.exec("COMMIT")
  } catch (error) {
    database.exec("ROLLBACK")
    throw error
  }
}
