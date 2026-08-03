import { describe, expect, it } from "vitest"
import { createMockWorkerThreadPoolFactory } from "../../tests/mockWorkerThreadPool"
import { createMetadataWorkerPoolHandle } from "./handle"
import type { MetadataWorkerCommand, MetadataWorkerCommandResult } from "./types"

const context = { defaultLanguage: "ru", version: "8.3.27" }

function operation(id: string, concurrency: number) {
  return { id, concurrency, context }
}

function createLines() {
  return createMockWorkerThreadPoolFactory<MetadataWorkerCommand, MetadataWorkerCommandResult>((command) => {
    if (command.kind === "runOperation" && command.command.kind === "probe") {
      return { kind: "probeResult", value: command.command.value }
    }
    return undefined
  })
}

describe("createMetadataWorkerPoolHandle", () => {
  it("лениво создаёт линии, растёт и не уничтожает их при уменьшении параллельности", async () => {
    const lines = createLines()
    const handle = createMetadataWorkerPoolHandle({ createLine: lines.factory })

    expect(handle.size()).toBe(0)
    await (await handle.beginOperation(operation("validation-1", 2))).finish("success")
    await (await handle.beginOperation(operation("validation-2", 4))).finish("success")
    await (await handle.beginOperation(operation("validation-3", 1))).finish("success")

    expect(lines.created()).toBe(4)
    expect(Array.from({ length: 4 }, (_, index) => lines.destroyCalls(index))).toEqual([0, 0, 0, 0])
  })

  it("не допускает две одновременные операции", async () => {
    const lines = createLines()
    const handle = createMetadataWorkerPoolHandle({ createLine: lines.factory })
    const active = await handle.beginOperation(operation("validation", 1))

    await expect(handle.beginOperation(operation("sync", 1))).rejects.toThrow("уже выполняет операцию")

    await active.finish("success")
  })

  it("сбрасывает временное состояние только использованных линий", async () => {
    const lines = createLines()
    const handle = createMetadataWorkerPoolHandle({ createLine: lines.factory })
    const active = await handle.beginOperation(operation("validation", 3))

    await active.run(1, { kind: "probe", value: "one" })
    await active.finish("failure")

    expect(lines.commands(0).map(({ kind }) => kind)).toEqual(["initializeLine"])
    expect(lines.commands(1).map(({ kind }) => kind)).toEqual([
      "initializeLine",
      "runOperation",
      "resetOperation",
    ])
    expect(lines.commands(2).map(({ kind }) => kind)).toEqual(["initializeLine"])
  })

  it("закрывает каждую линию один раз и запрещает новые операции", async () => {
    const lines = createLines()
    const handle = createMetadataWorkerPoolHandle({ createLine: lines.factory })
    await (await handle.beginOperation(operation("validation", 2))).finish("success")

    await Promise.all([handle.close(), handle.close()])

    expect([lines.destroyCalls(0), lines.destroyCalls(1)]).toEqual([1, 1])
    await expect(handle.beginOperation(operation("sync", 1))).rejects.toThrow("закрыт")
  })

  it("после ошибки заменяет только аварийную линию", async () => {
    let failed = false
    const lines = createMockWorkerThreadPoolFactory<MetadataWorkerCommand, MetadataWorkerCommandResult>((command) => {
      if (command.kind === "runOperation" && !failed) {
        failed = true
        throw new Error("worker crashed")
      }
      if (command.kind === "runOperation" && command.command.kind === "probe") {
        return { kind: "probeResult", value: command.command.value }
      }
      return undefined
    })
    const handle = createMetadataWorkerPoolHandle({ createLine: lines.factory })
    const first = await handle.beginOperation(operation("validation-1", 2))

    await expect(first.run(0, { kind: "probe", value: "one" })).rejects.toThrow("worker crashed")
    await first.finish("failure")
    const second = await handle.beginOperation(operation("validation-2", 2))
    await expect(second.run(0, { kind: "probe", value: "two" })).resolves.toEqual({
      kind: "probeResult",
      value: "two",
    })
    await second.finish("success")

    expect(lines.created()).toBe(3)
    expect(lines.destroyCalls(0)).toBe(1)
    expect(lines.destroyCalls(1)).toBe(0)
  })
})
