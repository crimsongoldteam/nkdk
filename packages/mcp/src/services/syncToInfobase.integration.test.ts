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
import { PlatformSessionError, recordPartialSyncDeliveryPhase } from "@nkdk/platform"
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
    expect(await fixture.runtime.sync.partial.readPending(
      fixture.projectDir,
      fixture.componentPath,
    )).toBeUndefined()
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

  it("после подтверждённого отказа сохраняет журнал и готовит пакет заново", async () => {
    const fixture = await createFixture({ rejectLoadOnce: true })

    const first = await syncToInfobase(input(fixture.projectDir), fixture.dependencies)
    expect(first).toMatchObject({ ok: false, code: "platform_command_failed" })
    expect(fs.existsSync(fixture.logPath)).toBe(true)

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
    expect(await publishedGeneration(fixture.projectDir, fixture.componentPath)).toBe(2n)
  }, 30_000)

  async function createFixture(options: {
    failFinalizeOnce?: boolean
    rejectLoadOnce?: boolean
    unknownLoadOnce?: boolean
    waitDuringLoad?: { started(): void; wait: Promise<void> }
    componentPath?: "cf" | `cfe/${string}`
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
      const languagePath = join(projectDir, "cf", "Язык", "Русский", "Свойства.yaml")
      fs.mkdirSync(join(languagePath, ".."), { recursive: true })
      fs.writeFileSync(join(projectDir, "cf", "Конфигурация.yaml"), baseRootYaml)
      fs.writeFileSync(languagePath, languageYaml)
      await writeConfigurationIndex({
        projectDir,
        address: { kind: "configuration" },
        data: {
          specificationVersion: "1.4",
          indexGeneration: 1n,
          componentPath: "cf",
          files: [
            { projectPath: "Конфигурация.yaml", contentHash: hashFileBytes(Buffer.from(baseRootYaml)) },
            { projectPath: "Язык/Русский/Свойства.yaml", contentHash: hashFileBytes(Buffer.from(languageYaml)) },
          ],
          entities: [{
            logicalAddress: "Язык.Русский",
            sourceProjectPath: "Язык/Русский/Свойства.yaml",
            identities: { uuid: "00000000-0000-4000-8000-000000000002", xmlName: "Русский" },
          }],
        },
      })
    }
    await writeConfigurationIndex({
      projectDir,
      address: componentPath === "cf"
        ? { kind: "configuration" }
        : { kind: "configurationExtension", name: componentPath.slice("cfe/".length) },
      data: {
        specificationVersion: "1.4",
        indexGeneration: 1n,
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
          return { mode: "designer-agent", reusedConnection: false, warnings: [] }
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

async function publishedGeneration(projectDir: string, componentPath = "cf"): Promise<bigint> {
  const bytes = await fs.promises.readFile(join(
    projectDir, ".nkdk", "components", ...componentPath.split("/"), "configuration-index.bin",
  ))
  return decodeConfigurationIndex(bytes, { expectedComponentPath: componentPath }).indexGeneration
}
