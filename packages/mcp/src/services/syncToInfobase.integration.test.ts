import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { BlobReader, TextWriter, ZipReader } from "@zip.js/zip.js"
import {
  createMetadataRuntime,
  hashFileBytes,
  parseComponentPath,
  type ConfigurationIndexBlockEntity,
  type ConfigurationProjectFile,
  type MetadataRuntime,
} from "@nkdk/runtime"
import {
  configurationIndexStoreDescriptor,
  createConfigurationIndexCandidateStore,
  openConfigurationIndexStore,
} from "@nkdk/runtime/configuration-index-store"
import { metadataRules } from "@nkdk/rules"
import { PlatformSessionError, recordPartialSyncDeliveryPhase } from "@nkdk/platform"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { syncToInfobase, type SyncToInfobaseDependencies } from "./syncToInfobase"

describe("полный цикл частичной синхронизации без платформы", () => {
  const temporaryProjects: string[] = []
  let runtime: MetadataRuntime
  let projectState: ReturnType<MetadataRuntime["projects"]["createState"]>

  beforeAll(() => {
    runtime = createMetadataRuntime({
      rules: metadataRules,
      workers: {
        preparedYamlProject: new URL(import.meta.resolve("@nkdk/rules/workers/prepared-yaml")),
        importFromXml: new URL(import.meta.resolve("@nkdk/rules/workers/import")),
        fullSyncToXml: new URL(import.meta.resolve("@nkdk/rules/workers/sync")),
        generic: new URL(import.meta.resolve("@nkdk/rules/workers/generic")),
      },
    })
    projectState = runtime.projects.createState()
  })

  afterAll(async () => {
    await runtime.close()
  })

  afterEach(async () => {
    await Promise.all(temporaryProjects.splice(0).map((path) =>
      fs.promises.rm(path, { recursive: true, force: true })))
  })

  it("передаёт ZIP, публикует следующее поколение и затем возвращает unchanged", async () => {
    const fixture = await createFixture()

    const first = await syncToInfobase(input(fixture.projectDir), fixture.dependencies)
    const second = await syncToInfobase(input(fixture.projectDir), fixture.dependencies)

    expect(first, JSON.stringify(first)).toMatchObject({ ok: true, status: "synchronized", finalizeStatus: "published" })
    expect(second).toMatchObject({ ok: true, status: "unchanged" })
    expect(fixture.platformCalls).toBe(1)
    expect(fixture.deliveryDuringLoad).toBe("transferring")
    expect(fixture.zipEntries).toEqual(expect.arrayContaining(["Catalogs/Test.xml", "load.lst"]))
    expect(fixture.loadList).toBe("Catalogs/Test.xml\n")
    expect(await publishedHash(fixture.projectDir)).toBe(hashFileBytes(Buffer.from("Синоним: Изменённый\n")))
    expect(await fixture.runtime.sync.partial.readPending(
      fixture.projectDir,
      fixture.componentPath,
    )).toBeUndefined()
    expect(fs.existsSync(fixture.archivePath!)).toBe(false)
  }, 30_000)

  it("включает XML внешнего свойства изменённого объекта", async () => {
    const changedYaml = [
      "Синоним: Изменённый",
      "Предопределенные:",
      "  Проверочный:",
      "    Наименование: Проверочный",
      "",
    ].join("\n")
    const fixture = await createFixture({ changedYaml })

    const result = await syncToInfobase(input(fixture.projectDir), fixture.dependencies)

    expect(result, JSON.stringify(result)).toMatchObject({ ok: true, status: "synchronized" })
    expect(fixture.zipEntries).toEqual(expect.arrayContaining([
      "Catalogs/Test.xml",
      "Catalogs/Test/Ext/Predefined.xml",
      "load.lst",
    ]))
    expect(fixture.loadList).toBe([
      "Catalogs/Test.xml",
      "Catalogs/Test/Ext/Predefined.xml",
      "",
    ].join("\n"))
  }, 30_000)

  it("после подтверждения платформы повторяет только незавершённую фиксацию", async () => {
    const fixture = await createFixture({ failFinalizeOnce: true })

    const first = await syncToInfobase(input(fixture.projectDir), fixture.dependencies)
    const second = await syncToInfobase(input(fixture.projectDir), fixture.dependencies)

    expect(first).toMatchObject({ ok: false, code: "core_error" })
    expect(second).toMatchObject({ ok: true, status: "synchronized", finalizeStatus: "published" })
    expect(fixture.platformCalls).toBe(1)
    expect(await publishedHash(fixture.projectDir)).toBe(hashFileBytes(Buffer.from("Синоним: Изменённый\n")))
  }, 30_000)

  it("после подтверждённого отказа сохраняет журнал и готовит пакет заново", async () => {
    const fixture = await createFixture({ rejectLoadOnce: true })

    const first = await syncToInfobase(input(fixture.projectDir), fixture.dependencies)
    expect(first).toMatchObject({ ok: false, code: "platform_command_failed" })
    expect(fs.existsSync(fixture.logPath)).toBe(true)
    expect(await fs.promises.readFile(fixture.logPath, "utf8")).toContain("pending-phase=prepared")

    const second = await syncToInfobase(input(fixture.projectDir), fixture.dependencies)
    expect(second).toMatchObject({ ok: true, status: "synchronized" })
    expect(fixture.platformCalls).toBe(2)
    expect(fs.existsSync(fixture.logPath)).toBe(false)
  }, 30_000)

  it("после неизвестного результата блокирует повторную передачу", async () => {
    const fixture = await createFixture({ unknownLoadOnce: true })

    const first = await syncToInfobase(input(fixture.projectDir), fixture.dependencies)
    expect(first).toMatchObject({ ok: false, code: "delivery_outcome_unknown" })
    expect(fixture.platformCalls).toBe(1)

    const second = await syncToInfobase(input(fixture.projectDir), fixture.dependencies)
    expect(second).toMatchObject({ ok: false, code: "delivery_outcome_unknown" })
    expect(fixture.platformCalls).toBe(1)
    expect(fs.existsSync(fixture.logPath)).toBe(true)
  }, 30_000)

  it("последовательно выполняет полные циклы одного проекта", async () => {
    let release!: () => void
    const wait = new Promise<void>((resolve) => { release = resolve })
    let started!: () => void
    const loadStarted = new Promise<void>((resolve) => { started = resolve })
    const fixture = await createFixture({ waitDuringLoad: { started, wait } })

    const first = syncToInfobase(input(fixture.projectDir), fixture.dependencies)
    await loadStarted
    const second = syncToInfobase(input(fixture.projectDir), fixture.dependencies)
    release()

    await expect(first).resolves.toMatchObject({ ok: true, status: "synchronized" })
    await expect(second).resolves.toMatchObject({ ok: true, status: "unchanged" })
    expect(fixture.platformCalls).toBe(1)
  }, 30_000)

  it("передаёт расширение через тот же полный цикл", async () => {
    const fixture = await createFixture({ componentPath: "cfe/Расширение" })

    const result = await syncToInfobase(
      { projectDir: fixture.projectDir, componentPath: fixture.componentPath, allowWrite: true },
      fixture.dependencies,
    )

    expect(result, JSON.stringify(result)).toMatchObject({
      ok: true,
      status: "synchronized",
      componentPath: "cfe/Расширение",
    })
    expect(fixture.extensionName).toBe("Расширение")
    expect(await publishedHash(fixture.projectDir, fixture.componentPath)).toBe(
      hashFileBytes(Buffer.from("Синоним: Изменённый\n")),
    )
  }, 30_000)

  async function createFixture(options: {
    failFinalizeOnce?: boolean
    rejectLoadOnce?: boolean
    unknownLoadOnce?: boolean
    waitDuringLoad?: { started(): void; wait: Promise<void> }
    componentPath?: "cf" | `cfe/${string}`
    changedYaml?: string
  } = {}) {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-sync-infobase-integration-"))
    temporaryProjects.push(projectDir)
    const componentPath = options.componentPath ?? "cf"
    const componentDir = join(projectDir, ...componentPath.split("/"))
    const catalogPath = join(componentDir, "Справочник", "Test", "Свойства.yaml")
    fs.mkdirSync(join(catalogPath, ".."), { recursive: true })
    const initialYaml = "Синоним: Исходный\n"
    fs.writeFileSync(catalogPath, initialYaml)
    const rootYaml = [
      "Имя: Расширение",
      "НазначениеРасширенияКонфигурации: Адаптация",
      "РежимСовместимостиРасширенияКонфигурации: Версия8_3_20",
      "",
    ].join("\n")
    if (componentPath !== "cf") {
      fs.writeFileSync(join(componentDir, "Конфигурация.yaml"), rootYaml)
      const baseRootYaml = "Имя: Конфигурация\nОсновнойЯзык: Русский\n"
      const languageYaml = "КодЯзыка: ru\n"
      const languagePath = join(projectDir, "cf", "Язык", "Русский.yaml")
      fs.mkdirSync(join(languagePath, ".."), { recursive: true })
      fs.writeFileSync(join(projectDir, "cf", "Конфигурация.yaml"), baseRootYaml)
      fs.writeFileSync(languagePath, languageYaml)
      await writeIndex({
        projectDir,
        componentPath: "cf",
        files: [
            { projectPath: "Конфигурация.yaml", contentHash: hashFileBytes(Buffer.from(baseRootYaml)) },
            { projectPath: "Язык/Русский.yaml", contentHash: hashFileBytes(Buffer.from(languageYaml)) },
        ],
        blockPath: "Конфигурация.yaml",
        entities: [{
          logicalAddress: "Конфигурация",
          uuid: "00000000-0000-4000-8000-000000000002",
        }],
      })
    }
    await writeIndex({
      projectDir,
      componentPath,
      files: [
          ...(componentPath === "cf" ? [] : [{
            projectPath: "Конфигурация.yaml",
            contentHash: hashFileBytes(Buffer.from(rootYaml)),
          }]),
          {
          projectPath: "Справочник/Test/Свойства.yaml",
          contentHash: hashFileBytes(Buffer.from(initialYaml)),
          },
        ],
      blockPath: "Справочник/Test/Свойства.yaml",
      entities: [{
          logicalAddress: "Справочник.Test",
          uuid: "00000000-0000-4000-8000-000000000001",
        }],
    })
    fs.writeFileSync(catalogPath, options.changedYaml ?? "Синоним: Изменённый\n")

    let platformCalls = 0
    let deliveryDuringLoad: string | undefined
    let zipEntries: string[] = []
    let loadList = ""
    let archivePath: string | undefined
    let extensionName: string | undefined
    let failFinalize = options.failFinalizeOnce === true
    let rejectLoad = options.rejectLoadOnce === true
    let unknownLoad = options.unknownLoadOnce === true
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
        componentPath,
        componentDir,
        nkdkDir: join(projectDir, ".nkdk"),
      }),
      projectState,
      core: {
        preparePartialSync: runtime.sync.partial.prepare,
        readPendingPartialSync: runtime.sync.partial.readPending,
        markPartialSyncTransferring: runtime.sync.partial.markTransferring,
        markPartialSyncPreparedAfterRejection: runtime.sync.partial.markPreparedAfterRejection,
        markPartialSyncApplied: runtime.sync.partial.markApplied,
        forceClearPendingSync: runtime.sync.partial.forceClear,
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
          await fs.promises.writeFile(params.logPath, "pending-phase=transferring\n")
          options.waitDuringLoad?.started()
          await options.waitDuringLoad?.wait
          if (rejectLoad) {
            rejectLoad = false
            throw new PlatformSessionError("platform_command_failed", "XML отклонён", {
              commandOutcome: "rejected",
              details: { stage: "configuration-load", mode: "designer-agent", logPath: params.logPath },
            })
          }
          if (unknownLoad) {
            unknownLoad = false
            throw new PlatformSessionError("delivery_outcome_unknown", "Связь потеряна", {
              commandOutcome: "unknown",
              details: { stage: "configuration-load", mode: "designer-agent", logPath: params.logPath },
            })
          }
          archivePath = params.archivePath
          extensionName = params.extensionName
          expect(fs.existsSync(params.archivePath)).toBe(true)
          deliveryDuringLoad = (await runtime.sync.partial.readPending(projectDir, componentPath))?.delivery.status
          const reader = new ZipReader(new BlobReader(new Blob([fs.readFileSync(params.archivePath)])))
          const entries = await reader.getEntries()
          zipEntries = entries.map(({ filename }) => filename)
          const listEntry = entries.find(({ filename }) => filename === "load.lst")
          if (listEntry === undefined || listEntry.directory) throw new Error("load.lst отсутствует")
          loadList = await listEntry.getData(new TextWriter())
          await reader.close()
          return { mode: "designer-agent", loadMode: "selected", reusedConnection: false, warnings: [] }
        },
      },
      recordDeliveryPhase: recordPartialSyncDeliveryPhase,
      fs: {
        async mkdir(path) { await fs.promises.mkdir(path, { recursive: true }) },
        async rm(path) { await fs.promises.rm(path, { recursive: true, force: true }) },
      },
      attemptId: () => "attempt-1",
    }
    return {
      projectDir,
      componentPath,
      runtime,
      dependencies,
      get platformCalls() { return platformCalls },
      get deliveryDuringLoad() { return deliveryDuringLoad },
      get zipEntries() { return zipEntries },
      get loadList() { return loadList },
      get archivePath() { return archivePath },
      get extensionName() { return extensionName },
      get logPath() { return join(projectDir, ".nkdk", "tmp", "sync-to-infobase", "attempt-1", "platform.log") },
    }
  }
})

function input(projectDir: string) {
  return { projectDir, allowWrite: true as const }
}

async function publishedHash(projectDir: string, componentPath = "cf"): Promise<bigint | undefined> {
  const store = openConfigurationIndexStore(
    configurationIndexStoreDescriptor(projectDir, parseComponentPath(componentPath)),
    "readOnly",
  )
  try {
    return store.readHashes().find(({ projectPath }) => projectPath === "Справочник/Test/Свойства.yaml")?.contentHash
  } finally {
    await store.close()
  }
}

async function writeIndex(params: {
  readonly projectDir: string
  readonly componentPath: string
  readonly files: readonly ConfigurationProjectFile[]
  readonly blockPath: string
  readonly entities: readonly ConfigurationIndexBlockEntity[]
}): Promise<void> {
  const address = parseComponentPath(params.componentPath)
  const candidate = await createConfigurationIndexCandidateStore({
    projectDir: params.projectDir,
    address,
    operationId: `test-${Math.random()}`,
    purpose: "import",
  })
  candidate.replaceHashes(params.files)
  candidate.mergeBlockFragment({ targetProjectPath: params.blockPath, entities: params.entities })
  const active = openConfigurationIndexStore(
    configurationIndexStoreDescriptor(params.projectDir, address),
    "readWrite",
  )
  await active.publishImportedCandidate(candidate)
}
