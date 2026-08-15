import { describe, expect, it, vi } from "vitest"
import { createMetadataDiagnosticCollectionFromDiagnostics } from "@nkdk/runtime"
import type { ProjectStateService } from "../projectState"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import { createUnusedMetadataWorkerPool } from "../../tests/metadataWorkerTestPool"
import { syncComponentToXml } from "./syncConfiguration"
import { createMockFullSyncDependencies, emptyProjectStateReadSession } from "./testHelpers"
import {
  createFullXmlSyncDiagnosticCollectionFromDiagnostics,
  createFullXmlSyncFileCollectionFromFiles,
} from "./workerPool"

describe("full XML sync failure integration", () => {
  const context = { version: "2.20", languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' }, exportToYAML: { toTyped: false } } as const

  it("не трогает непустой XML-каталог", async () => {
    const dependencies = createMockFullSyncDependencies({
      async exists() { return true },
      async isDirectoryEmpty() { return false },
    })
    const result = await run(dependencies)

    expect(result.failed).toEqual([expect.objectContaining({ code: "full_xml_sync_target_not_empty" })])
  })

  it("не публикует кандидат после ошибки worker", async () => {
    const transfer = vi.fn(async () => ({ copiedFiles: [], projectFiles: [] }))
    const publish = vi.fn(async () => undefined)
    const dependencies = createMockFullSyncDependencies({
      createWorkerPool: () => ({
        async initialize() {},
        async execute() {
          return {
            warnings: createFullXmlSyncDiagnosticCollectionFromDiagnostics([]),
            diagnostics: createFullXmlSyncDiagnosticCollectionFromDiagnostics([{
              severity: "error",
              code: "full_xml_sync_assignment_failed",
              message: "Не удалось построить XML",
            }]),
            writtenFiles: createFullXmlSyncFileCollectionFromFiles([]),
            expectedOutputs: createFullXmlSyncFileCollectionFromFiles([]),
          }
        },
        async close() {},
      }),
      transferExternalFiles: transfer,
      publishCandidate: publish,
    })

    const result = await run(dependencies)

    expect(result.failed).toEqual([expect.objectContaining({ code: "full_xml_sync_assignment_failed" })])
    expect(transfer).not.toHaveBeenCalled()
    expect(publish).not.toHaveBeenCalled()
  })

  it("не публикует кандидат при ошибке переноса внешнего файла", async () => {
    const publish = vi.fn(async () => undefined)
    const dependencies = createMockFullSyncDependencies({
      async transferExternalFiles() { throw new Error("copy failed") },
      publishCandidate: publish,
    })

    const result = await run(dependencies)

    expect(result.failed).toEqual([expect.objectContaining({ message: "copy failed" })])
    expect(publish).not.toHaveBeenCalled()
  })

  it("не запускает worker, если профиль расширения не подтвердил UUID", async () => {
    let workerStarted = false
    const dependencies = createMockFullSyncDependencies({
      resolveProfile: () => ({
        kind: "configurationExtension",
        supports: () => true,
        baseAddress: () => ({ kind: "configuration" }),
        confirm() { throw new Error("Не найден UUID заимствованного элемента") },
      }),
      createWorkerPool: () => {
        workerStarted = true
        throw new Error("worker must not be created")
      },
    })

    const result = await run(dependencies, "cfe/Дополнение")

    expect(result.failed).toEqual([expect.objectContaining({ message: "Не найден UUID заимствованного элемента" })])
    expect(workerStarted).toBe(false)
  })

  function run(
    dependencies: ReturnType<typeof createMockFullSyncDependencies>,
    componentPath = "cf",
  ) {
    return syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath,
      xmlDir: "/out",
      projectState: projectState(componentPath),
    }, dependencies)
  }
})

function projectState(componentPath: string): ProjectStateService {
  return {
    workers: createUnusedMetadataWorkerPool(),
    async beginImport() { throw new Error("not used") },
    async refreshAndValidate() {
      return {
        diagnostics: createMetadataDiagnosticCollectionFromDiagnostics([]),
        readToken: createTestProjectStateReadToken(),
        stats: { hashedFiles: 1, parsedYamlFiles: 0, changedFiles: 0, deletedFiles: 0 },
      }
    },
    async createReadToken() { return createTestProjectStateReadToken() },
    async readComponentProjection() {
      const hashBytes = new Uint8Array(8)
      new DataView(hashBytes.buffer).setBigUint64(0, 10n, false)
      return {
        componentPath,
        projectFiles: [{ projectPath: `${componentPath}/Конфигурация.yaml` }],
        hashBytes,
      }
    },
    openReadSession() { return emptyProjectStateReadSession() },
    async reset() {},
    async rebuild() { throw new Error("not used") },
    async close() {},
  }
}
