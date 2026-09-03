import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { prepareOrReuseBaseline } from "./baseline"
import type { InfobaseArchiveStore } from "./infobase-archive"
import type { ScenarioMcpSession } from "./mcp-session"

const roots: string[] = []
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))) })

describe("stepwise baseline", () => {
  it("публикует эталон только после загрузки, импорта, валидации и dump", async () => {
    const fixture = await createFixture()

    const baseline = await prepareOrReuseBaseline(fixture.params, fixture.dependencies)

    expect(fixture.calls).toEqual([
      "platform-version", "prepare-infobase", "write-settings", "open-mcp",
      "import-cf", "import-cfe", "validate", "close-mcp", "dump",
    ])
    expect(baseline.manifest.compatibilityHash).toMatch(/^[a-f0-9]{64}$/u)
    expect(JSON.parse(await readFile(join(fixture.baselineDir, "current", "manifest.json"), "utf8")))
      .toMatchObject({ version: 1, platformVersion: "8.3.27.2214", nkdkBuildId: "build-1" })
    await expect(readFile(join(baseline.projectDir, ".nkdk", "cache", "project-state.bin")))
      .rejects.toMatchObject({ code: "ENOENT" })
    await expect(readFile(join(baseline.projectDir, ".nkdk", "components", "cf", "index.lmdb")))
      .rejects.toMatchObject({ code: "ENOENT" })
  })

  it("переиспользует полностью совместимый эталон", async () => {
    const fixture = await createFixture()
    const first = await prepareOrReuseBaseline(fixture.params, fixture.dependencies)
    fixture.calls.length = 0

    const second = await prepareOrReuseBaseline(fixture.params, fixture.dependencies)

    expect(second.manifest).toEqual(first.manifest)
    expect(fixture.calls).toEqual(["platform-version"])
  })

  it("перестраивает эталон после изменения фикстуры", async () => {
    const fixture = await createFixture()
    const first = await prepareOrReuseBaseline(fixture.params, fixture.dependencies)
    fixture.calls.length = 0
    await writeFile(join(fixture.cfDir, "fixture.xml"), "changed")

    const second = await prepareOrReuseBaseline(fixture.params, fixture.dependencies)

    expect(second.manifest.compatibilityHash).not.toBe(first.manifest.compatibilityHash)
    expect(fixture.calls).toContain("prepare-infobase")
  })
})

async function createFixture() {
  const root = await mkdtemp(join(tmpdir(), "nkdk-stepwise-baseline-"))
  roots.push(root)
  const baselineDir = join(root, "baseline")
  const cfDir = join(root, "fixtures", "cf")
  const cfeDir = join(root, "fixtures", "cfe")
  await Promise.all([baselineDir, cfDir, cfeDir].map((path) => mkdir(path, { recursive: true })))
  await writeFile(join(cfDir, "fixture.xml"), "cf")
  await writeFile(join(cfeDir, "fixture.xml"), "cfe")
  const calls: string[] = []
  const session: ScenarioMcpSession = {
    async call<T>(name: string) {
      calls.push(name === "nkdk.import_from_infobase"
        ? calls.includes("import-cf") ? "import-cfe" : "import-cf"
        : "validate")
      return { ok: true, failed: [], diagnostics: [], summary: { errors: 0 } } as T
    },
    async close() { calls.push("close-mcp") },
  }
  const archiveStore: InfobaseArchiveStore = {
    async create() { throw new Error("unexpected create") },
    async dump({ archivePath }) {
      calls.push("dump")
      await writeFile(archivePath, "database")
      return { elapsedMs: 1, sizeBytes: 8, requiresReconnect: true }
    },
    async restore() { throw new Error("unexpected restore") },
  }
  return {
    root,
    baselineDir,
    cfDir,
    calls,
    params: {
      baselineDir,
      cfXmlDir: cfDir,
      extensionXmlDir: cfeDir,
      extensionName: "Расширение_All",
      mode: "designer-agent" as const,
      nkdkBuildId: "build-1",
    },
    dependencies: {
      async platformVersion() { calls.push("platform-version"); return "8.3.27.2214" },
      async prepareInfobase({ baseDir, projectDir }: { baseDir: string; projectDir: string }) {
        calls.push("prepare-infobase")
        await mkdir(baseDir, { recursive: true })
        await mkdir(projectDir, { recursive: true })
        await writeFile(join(baseDir, "1Cv8.1CD"), "base")
        await mkdir(join(projectDir, ".nkdk", "cache"), { recursive: true })
        await mkdir(join(projectDir, ".nkdk", "components", "cf"), { recursive: true })
        await writeFile(join(projectDir, ".nkdk", "cache", "project-state.bin"), "cache")
        await writeFile(join(projectDir, ".nkdk", "components", "cf", "index.lmdb"), "index")
      },
      async writeProjectSettings() { calls.push("write-settings") },
      async openSession() { calls.push("open-mcp"); return session },
      createArchiveStore() { return archiveStore },
      operationId() { return "operation-1" },
    },
  }
}
