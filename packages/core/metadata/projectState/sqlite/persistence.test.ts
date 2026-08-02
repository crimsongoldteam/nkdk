import fs from "node:fs"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ProjectStateCompatibility } from "../compatibility"
import type { ProjectStateFileUpdate } from "../fileUpdate"
import { trackTempProjectDirs } from "../tests/tempProjectDir"
import {
  openPersistentSqliteProjectStateStore,
  projectStateSnapshotPath,
  type SqliteProjectStatePersistenceHooks,
} from "./persistence"

const compatibility: ProjectStateCompatibility = {
  schemaVersion: 1,
  producerVersion: "test",
  rulesFingerprint: "rules-a",
  hashAlgorithm: "xxhash64-be-v1",
}

describe("SQLite project state persistence", () => {
  const projectDirs = trackTempProjectDirs("nkdk-project-state-")
  const createProjectDir = projectDirs.create

  afterEach(async () => {
    vi.restoreAllMocks()
    await projectDirs.removeAll()
  })

  it("открывает отсутствующий снимок пустым", async () => {
    const projectDir = await createProjectDir()
    const fixture = await openPersistentSqliteProjectStateStore({ projectDir, compatibility })

    expect(fixture.store.readComponentProjection("cf").updates).toEqual([])
    fixture.store.close()
  })

  it("сохраняет минимальный checkpoint и загружает его при повторном открытии", async () => {
    const projectDir = await createProjectDir()
    const first = await openPersistentSqliteProjectStateStore({ projectDir, compatibility })

    const updates = [resource("cf/a.bin")]
    const hashBytes = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8])
    first.store.beginUpdate()
    first.store.replaceFiles({ updates, hashBytes })
    first.store.commitUpdate()
    await first.store.checkpoint()
    first.store.close()

    const reopened = await openPersistentSqliteProjectStateStore({ projectDir, compatibility })
    expect(reopened.store.readComponentProjection("cf").updates).toEqual(updates)
    expect(reopened.store.compareFiles({ files: updates.map(identity), hashBytes })).toEqual({ changed: [], deleted: [] })
    reopened.store.close()
  })

  it("игнорирует повреждённый снимок без диагностики проекта", async () => {
    const projectDir = await createProjectDir()
    const target = projectStateSnapshotPath(projectDir)
    await fs.promises.mkdir(join(target, ".."), { recursive: true })
    await fs.promises.writeFile(target, "not sqlite")

    const fixture = await openPersistentSqliteProjectStateStore({ projectDir, compatibility })

    expect(fixture.store.readComponentProjection("cf").updates).toEqual([])
    expect(fixture.store.readLocalDiagnostics()).toEqual([])
    fixture.store.close()
  })

  it.each([
    ["schemaVersion", { ...compatibility, schemaVersion: 2 } as unknown as ProjectStateCompatibility],
    ["producerVersion", { ...compatibility, producerVersion: "other" }],
    ["rulesFingerprint", { ...compatibility, rulesFingerprint: "rules-b" }],
    ["hashAlgorithm", { ...compatibility, hashAlgorithm: "other" } as unknown as ProjectStateCompatibility],
  ])("открывает пустое состояние при несовместимости %s", async (_field, actual) => {
    const projectDir = await createProjectDir()
    const first = await openPersistentSqliteProjectStateStore({ projectDir, compatibility })
    first.store.beginUpdate()
    first.store.replaceFiles({ updates: [resource("cf/old.bin")], hashBytes: new Uint8Array(8) })
    first.store.commitUpdate()
    await first.store.checkpoint()
    first.store.close()

    const incompatible = await openPersistentSqliteProjectStateStore({ projectDir, compatibility: actual })

    expect(incompatible.store.readComponentProjection("cf").updates).toEqual([])
    incompatible.store.close()
  })

  it.each(["backup", "quick_check", "rename"] as const)("сохраняет предыдущий снимок при ошибке %s", async (stage) => {
    const projectDir = await createProjectDir()
    let injectFailure = false
    const hooks: SqliteProjectStatePersistenceHooks = {
      backup: async (database, target) => {
        if (injectFailure && stage === "backup") throw new Error("backup failed")
        await fs.promises.writeFile(target, database.serialize())
      },
      verifySnapshot: () => {
        if (injectFailure && stage === "quick_check") throw new Error("quick_check failed")
      },
    }
    const first = await openPersistentSqliteProjectStateStore({ projectDir, compatibility, hooks })
    first.store.beginUpdate()
    first.store.replaceFiles({ updates: [resource("cf/old.bin")], hashBytes: new Uint8Array(8) })
    first.store.commitUpdate()
    await first.store.checkpoint()
    injectFailure = true
    if (stage === "rename") vi.spyOn(fs.promises, "rename").mockRejectedValueOnce(new Error("rename failed"))
    first.store.beginUpdate()
    first.store.replaceFiles({ updates: [resource("cf/new.bin")], hashBytes: new Uint8Array(8) })
    first.store.commitUpdate()

    await expect(first.store.checkpoint()).rejects.toThrow(`${stage} failed`)
    first.store.close()

    const reopened = await openPersistentSqliteProjectStateStore({ projectDir, compatibility })
    expect(reopened.store.readComponentProjection("cf").updates).toEqual([resource("cf/old.bin")])
    expect((await fs.promises.readdir(join(projectDir, ".nkdk", "cache"))).sort()).toEqual(["project-state.sqlite"])
    reopened.store.close()
  })
})

const resource = (projectPath: string): ProjectStateFileUpdate => ({
  kind: "resource",
  projectPath,
  componentPath: "cf",
  resourceKind: "resource",
})

const identity = ({ kind: _kind, ...value }: ProjectStateFileUpdate) => value
