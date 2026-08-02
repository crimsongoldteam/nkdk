import fs from "node:fs"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"
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
  const atomicReplacementDirs = trackTempProjectDirs("nkdk-project-state-atomic-")
  let atomicProjectDir = ""
  let atomicReplacementProjectDir = ""

  beforeAll(async () => {
    atomicProjectDir = await atomicReplacementDirs.create()
    atomicReplacementProjectDir = await atomicReplacementDirs.create()
    await writeSnapshot(atomicProjectDir, "cf/a.bin")
    await writeSnapshot(atomicReplacementProjectDir, "cf/b.bin")
  })

  afterAll(async () => {
    await atomicReplacementDirs.removeAll()
  })

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
    expectStoredResource(reopened, "cf/a.bin")
    expect(reopened.store.compareFiles({ files: updates.map(identity), hashBytes })).toEqual({ changed: [], deleted: [] })
    reopened.store.close()
  })

  it("проверяет и копирует один attached snapshot при атомарной замене пути", async () => {
    const snapshotPath = projectStateSnapshotPath(atomicProjectDir)
    const replacementPath = projectStateSnapshotPath(atomicReplacementProjectDir)
    const close = DatabaseSync.prototype.close
    let replaceOnNextClose = true
    vi.spyOn(DatabaseSync.prototype, "close").mockImplementation(function (this: DatabaseSync) {
      close.call(this)
      if (!replaceOnNextClose) return
      replaceOnNextClose = false
      fs.renameSync(replacementPath, snapshotPath)
    })

    const reopened = await openPersistentSqliteProjectStateStore({ projectDir: atomicProjectDir, compatibility })

    expectStoredResource(reopened, "cf/a.bin")
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

async function writeSnapshot(projectDir: string, projectPath: string): Promise<void> {
  const fixture = await openPersistentSqliteProjectStateStore({ projectDir, compatibility })
  fixture.store.beginUpdate()
  fixture.store.replaceFiles({ updates: [resource(projectPath)], hashBytes: new Uint8Array(8) })
  fixture.store.commitUpdate()
  await fixture.store.checkpoint()
  fixture.store.close()
}

function expectStoredResource(
  fixture: Awaited<ReturnType<typeof openPersistentSqliteProjectStateStore>>,
  projectPath: string,
): void {
  expect(fixture.store.readComponentProjection("cf").updates).toEqual([resource(projectPath)])
  const readSession = fixture.openReadSession(fixture.store.createReadToken())
  expect(readSession.readValidationStatus({ offset: 0, batchSize: 10 })).toEqual([{
    projectPath,
    componentPath: "cf",
  }])
  readSession.close()
}
