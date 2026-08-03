import { describe, expect, it, vi } from "vitest"
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
})
