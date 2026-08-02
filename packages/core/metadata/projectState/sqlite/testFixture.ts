import { afterEach } from "vitest"
import { createSqliteProjectStateStore, type SqliteProjectStateStoreFixture } from "./store"

export const sqliteProjectStateTestCompatibility = {
  schemaVersion: 1,
  producerVersion: "test",
  rulesFingerprint: "test-rules",
  hashAlgorithm: "xxhash64-be-v1",
} as const

const fixtures: SqliteProjectStateStoreFixture[] = []

afterEach(() => {
  for (const fixture of fixtures.splice(0)) fixture.store.close()
})

export function createSqliteProjectStateTestFixture(): SqliteProjectStateStoreFixture {
  const fixture = createSqliteProjectStateStore({
    projectDir: "/project",
    compatibility: sqliteProjectStateTestCompatibility,
  })
  fixtures.push(fixture)
  return fixture
}
