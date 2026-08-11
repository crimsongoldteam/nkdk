import { describe, expect, it, vi } from "vitest"
import { createMetadataWorkerOperationRegistry } from "./operationRegistry"
import { createMetadataWorkerOperations } from "../composition/workerOperations"
import type { MetadataWorkerPersistentState } from "./workerState"

const state = {} as MetadataWorkerPersistentState

describe("metadata worker operation registry", () => {
  it("isolates handlers between registry instances", async () => {
    const first = createMetadataWorkerOperationRegistry()
    const second = createMetadataWorkerOperationRegistry()
    first.register("probe", async () => ({ kind: "probeResult", value: "first" }))
    second.register("probe", async () => ({ kind: "probeResult", value: "second" }))

    await expect(first.run({ kind: "probe", value: "x" }, state)).resolves.toEqual({
      kind: "probeResult",
      value: "first",
    })
    await expect(second.run({ kind: "probe", value: "x" }, state)).resolves.toEqual({
      kind: "probeResult",
      value: "second",
    })
  })

  it("composes a fresh production registry", async () => {
    const first = createMetadataWorkerOperations()
    const second = createMetadataWorkerOperations()

    await expect(first.run({ kind: "probe", value: "one" }, state)).resolves.toEqual({
      kind: "probeResult",
      value: "one",
    })
    await expect(second.run({ kind: "probe", value: "two" }, state)).resolves.toEqual({
      kind: "probeResult",
      value: "two",
    })
  })

  it("routes a command to the handler with the same kind", async () => {
    const registry = createMetadataWorkerOperationRegistry()
    const handler = vi.fn(async (command: { readonly kind: "probe"; readonly value: string }) => ({
      kind: "probeResult" as const,
      value: command.value,
    }))
    registry.register("probe", handler)

    await expect(registry.run({ kind: "probe", value: "ready" }, state))
      .resolves.toEqual({ kind: "probeResult", value: "ready" })
    expect(handler).toHaveBeenCalledWith({ kind: "probe", value: "ready" }, state)
  })

  it("rejects a duplicate kind", () => {
    const registry = createMetadataWorkerOperationRegistry()
    registry.register("probe", async (command) => ({ kind: "probeResult", value: command.value }))

    expect(() => registry.register("probe", async (command) => ({
      kind: "probeResult",
      value: command.value,
    }))).toThrow("Worker operation уже зарегистрирована: probe")
  })

  it("rejects an unknown kind", async () => {
    const registry = createMetadataWorkerOperationRegistry()
    await expect(registry.run(
      { kind: "unknown" } as never,
      state,
    )).rejects.toThrow("Worker operation не зарегистрирована: unknown")
  })
})
