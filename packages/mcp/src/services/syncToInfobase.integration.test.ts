import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { BlobReader, TextWriter, ZipReader } from "@zip.js/zip.js"
import {
  createMetadataRuntime,
  decodeConfigurationIndex,
  hashFileBytes,
  writeConfigurationIndex,
  type MetadataRuntime,
} from "@nkdk/runtime"
import { metadataRules } from "@nkdk/rules"
import { afterEach, describe, expect, it } from "vitest"
import { syncToInfobase, type SyncToInfobaseDependencies } from "./syncToInfobase"

const describeIntegration = process.env["NKDK_TEST_PARTIAL_SYNC"] === "1" ? describe : describe.skip

describeIntegration("полный цикл частичной синхронизации без платформы", () => {
  const temporaryProjects: string[] = []
  const runtimes: MetadataRuntime[] = []

  afterEach(async () => {
    await Promise.all(runtimes.splice(0).map((runtime) => runtime.close()))
    await Promise.all(temporaryProjects.splice(0).map((path) =>
      fs.promises.rm(path, { recursive: true, force: true })))
  })

  it("передаёт ZIP, публикует следующее поколение и затем возвращает unchanged", async () => {
    const fixture = await createFixture()

    const first = await syncToInfobase(input(fixture.projectDir), fixture.dependencies)
    const second = await syncToInfobase(input(fixture.projectDir), fixture.dependencies)

    expect(first).toMatchObject({ ok: true, status: "synchronized", finalizeStatus: "published" })
    expect(second).toMatchObject({ ok: true, status: "unchanged" })
    expect(fixture.platformCalls).toBe(1)
    expect(fixture.deliveryDuringLoad).toBe("transferring")
    expect(fixture.zipEntries).toEqual(expect.arrayContaining(["Catalogs/Test.xml", "load.lst"]))
    expect(fixture.loadList).toBe("Catalogs/Test.xml\n")
    expect(await publishedGeneration(fixture.projectDir)).toBe(2n)
    expect(await fixture.runtime.sync.partial.readPending(fixture.projectDir, "cf")).toBeUndefined()
    expect(fs.existsSync(fixture.archivePath!)).toBe(false)
  }, 30_000)

  it("после подтверждения платформы повторяет только незавершённую фиксацию", async () => {
    const fixture = await createFixture({ failFinalizeOnce: true })

    const first = await syncToInfobase(input(fixture.projectDir), fixture.dependencies)
    const second = await syncToInfobase(input(fixture.projectDir), fixture.dependencies)

    expect(first).toMatchObject({ ok: false, code: "core_error" })
    expect(second).toMatchObject({ ok: true, status: "synchronized", finalizeStatus: "published" })
    expect(fixture.platformCalls).toBe(1)
    expect(await publishedGeneration(fixture.projectDir)).toBe(2n)
  }, 30_000)

  async function createFixture(options: { failFinalizeOnce?: boolean } = {}) {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-sync-infobase-integration-"))
    temporaryProjects.push(projectDir)
    const catalogPath = join(projectDir, "cf", "Справочник", "Test", "Свойства.yaml")
    fs.mkdirSync(join(catalogPath, ".."), { recursive: true })
    const initialYaml = "Синоним: Исходный\n"
    fs.writeFileSync(catalogPath, initialYaml)
    await writeConfigurationIndex({
      projectDir,
      address: { kind: "configuration" },
      data: {
        specificationVersion: "1.4",
        indexGeneration: 1n,
        componentPath: "cf",
        files: [{
          projectPath: "Справочник/Test/Свойства.yaml",
          contentHash: hashFileBytes(Buffer.from(initialYaml)),
        }],
        entities: [{
          logicalAddress: "Справочник.Test",
          sourceProjectPath: "Справочник/Test/Свойства.yaml",
          identities: {
            uuid: "00000000-0000-4000-8000-000000000001",
            xmlName: "Test",
          },
        }],
      },
    })
    fs.writeFileSync(catalogPath, "Синоним: Изменённый\n")

    const runtime = createMetadataRuntime({
      rules: metadataRules,
      workers: {
        preparedYamlProject: new URL(import.meta.resolve("@nkdk/rules/workers/prepared-yaml")),
        importFromXml: new URL(import.meta.resolve("@nkdk/rules/workers/import")),
        fullSyncToXml: new URL(import.meta.resolve("@nkdk/rules/workers/sync")),
        generic: new URL(import.meta.resolve("@nkdk/rules/workers/generic")),
      },
    })
    runtimes.push(runtime)
    const projectState = runtime.projects.createState()
    let platformCalls = 0
    let deliveryDuringLoad: string | undefined
    let zipEntries: string[] = []
    let loadList = ""
    let archivePath: string | undefined
    let failFinalize = options.failFinalizeOnce === true
    const dependencies: SyncToInfobaseDependencies = {
      async readSettings() {
        return {
          status: "ready",
          projectDir,
          settingsPath: join(projectDir, ".nkdk", "project.yaml"),
          settings: {
            infobase: {
              connectionString: "File=/base",
              sessionIdleTimeout: 900,
              operations: { import: { mode: "designer-agent", unresolvedReferences: "include" } },
            },
          },
        }
      },
      resolveComponent: () => ({
        ok: true,
        projectDir,
        componentPath: "cf",
        componentDir: join(projectDir, "cf"),
        nkdkDir: join(projectDir, ".nkdk"),
      }),
      projectState,
      core: {
        preparePartialSync: runtime.sync.partial.prepare,
        readPendingPartialSync: runtime.sync.partial.readPending,
        markPartialSyncTransferring: runtime.sync.partial.markTransferring,
        markPartialSyncPreparedAfterRejection: runtime.sync.partial.markPreparedAfterRejection,
        markPartialSyncApplied: runtime.sync.partial.markApplied,
        async finalizePartialSync(params) {
          if (failFinalize) {
            failFinalize = false
            throw new Error("planned finalize failure")
          }
          return runtime.sync.partial.finalize(params)
        },
      },
      platformManager: {
        async loadPartialConfiguration(params) {
          platformCalls += 1
          archivePath = params.archivePath
          expect(fs.existsSync(params.archivePath)).toBe(true)
          deliveryDuringLoad = (await runtime.sync.partial.readPending(projectDir, "cf"))?.delivery.status
          const reader = new ZipReader(new BlobReader(new Blob([fs.readFileSync(params.archivePath)])))
          const entries = await reader.getEntries()
          zipEntries = entries.map(({ filename }) => filename)
          const listEntry = entries.find(({ filename }) => filename === "load.lst")
          if (listEntry === undefined || listEntry.directory) throw new Error("load.lst отсутствует")
          loadList = await listEntry.getData(new TextWriter())
          await reader.close()
          return { mode: "designer-agent", reusedConnection: false, warnings: [] }
        },
      },
      fs: {
        async mkdir(path) { await fs.promises.mkdir(path, { recursive: true }) },
        async rm(path) { await fs.promises.rm(path, { recursive: true, force: true }) },
      },
      attemptId: () => "attempt-1",
    }
    return {
      projectDir,
      runtime,
      dependencies,
      get platformCalls() { return platformCalls },
      get deliveryDuringLoad() { return deliveryDuringLoad },
      get zipEntries() { return zipEntries },
      get loadList() { return loadList },
      get archivePath() { return archivePath },
    }
  }
})

function input(projectDir: string) {
  return { projectDir, allowWrite: true as const }
}

async function publishedGeneration(projectDir: string): Promise<bigint> {
  const bytes = await fs.promises.readFile(join(
    projectDir, ".nkdk", "components", "cf", "configuration-index.bin",
  ))
  return decodeConfigurationIndex(bytes, { expectedComponentPath: "cf" }).indexGeneration
}
