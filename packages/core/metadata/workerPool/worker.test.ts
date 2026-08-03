import { describe, expect, it, vi } from "vitest"
import { mockContextFromXML } from "../../tests/mockContext"
import { createMetadataWorkerCommandHandler } from "./worker"

const context = { defaultLanguage: "ru", version: "8.3.27" }

describe("единая точка входа worker", () => {
  it("маршрутизирует команду операции после инициализации", async () => {
    const createState = vi.fn(async () => ({
      beginOperation: vi.fn(),
      resetOperation: vi.fn(),
      installProjectState: vi.fn(),
      clearProjectState: vi.fn(),
    }))
    const run = createMetadataWorkerCommandHandler({ createState: createState as never })

    await expect(run({ kind: "initializeLine", workerIndex: 2, context })).resolves.toBeUndefined()
    await expect(run({
      kind: "runOperation",
      operationId: "validation",
      command: { kind: "probe", value: "ready" },
    })).resolves.toEqual({ kind: "probeResult", value: "ready" })

    expect(createState).toHaveBeenCalledTimes(1)
  })

  it("не выполняет предметную команду до инициализации", async () => {
    const run = createMetadataWorkerCommandHandler()

    await expect(run({
      kind: "runOperation",
      operationId: "validation",
      command: { kind: "probe", value: "ready" },
    })).rejects.toThrow("не инициализирован")
  })

  it("маршрутизирует import через ту же линию и возвращает явное подтверждение", async () => {
    const runImportCommand = vi.fn(async () => undefined)
    const run = createMetadataWorkerCommandHandler({
      createState: (async () => ({
        schemaCache: {},
        rulesSnapshot: {},
        beginOperation: vi.fn(),
        resetOperation: vi.fn(),
        installProjectState: vi.fn(),
        clearProjectState: vi.fn(),
      })) as never,
      runImportCommand: runImportCommand as never,
    })
    await run({ kind: "initializeLine", workerIndex: 0, context })

    const baseImportContext = mockContextFromXML()
    const command = {
      kind: "initialize" as const,
      operationId: "import",
      workerIndex: 0,
      context: {
        ...baseImportContext,
        fromXML: { ...baseImportContext.fromXML, componentKind: "configuration" },
      },
      outputDir: "/tmp/output",
    }
    await expect(run({
      kind: "runOperation",
      operationId: "import",
      command: { kind: "import", command },
    })).resolves.toEqual({ kind: "importResult", result: undefined })

    expect(runImportCommand).toHaveBeenCalledWith(command, expect.objectContaining({
      persistentValidationState: expect.any(Object),
    }))
  })

  it.each(["success", "failure", "cancelled"] as const)(
    "очищает временное состояние после исхода %s, сохраняя постоянное состояние линии",
    async (outcome) => {
      const resetOperation = vi.fn()
      const persistentState = {
        schemaCache: {},
        rulesSnapshot: {},
        beginOperation: vi.fn(),
        resetOperation,
        installProjectState: vi.fn(),
        clearProjectState: vi.fn(),
      }
      const createState = vi.fn(async () => persistentState)
      const runImportCommand = vi.fn(async () => undefined)
      const run = createMetadataWorkerCommandHandler({
        createState: createState as never,
        runImportCommand: runImportCommand as never,
      })
      await run({ kind: "initializeLine", workerIndex: 0, context })
      await run({ kind: "resetOperation", operationId: "import", outcome })

      expect(runImportCommand).toHaveBeenCalledWith({ kind: "dispose" })
      expect(resetOperation).toHaveBeenCalledWith("import")
      expect(createState).toHaveBeenCalledTimes(1)
    },
  )
})
