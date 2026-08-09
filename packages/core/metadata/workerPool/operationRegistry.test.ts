import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  registerMetadataWorkerOperation,
  resetMetadataWorkerOperationRegistryForTests,
  runRegisteredMetadataWorkerOperation,
} from "./operationRegistry"
import {
  registerMetadataWorkerOperations,
  resetMetadataWorkerOperationsRegistrationForTests,
} from "./registerOperations"
import type { MetadataWorkerPersistentState } from "./workerState"

const state = {} as MetadataWorkerPersistentState

describe("metadata worker operation registry", () => {
  beforeEach(() => {
    resetMetadataWorkerOperationRegistryForTests()
    resetMetadataWorkerOperationsRegistrationForTests()
  })

  afterEach(() => {
    resetMetadataWorkerOperationRegistryForTests()
    resetMetadataWorkerOperationsRegistrationForTests()
    registerMetadataWorkerOperations()
  })

  it("routes a command to the handler with the same kind", async () => {
    const handler = vi.fn(async (command: { readonly kind: "probe"; readonly value: string }) => ({
      kind: "probeResult" as const,
      value: command.value,
    }))
    registerMetadataWorkerOperation("probe", handler)

    await expect(runRegisteredMetadataWorkerOperation({ kind: "probe", value: "ready" }, state))
      .resolves.toEqual({ kind: "probeResult", value: "ready" })
    expect(handler).toHaveBeenCalledWith({ kind: "probe", value: "ready" }, state)
  })

  it("rejects a duplicate kind", () => {
    registerMetadataWorkerOperation("probe", async (command) => ({ kind: "probeResult", value: command.value }))

    expect(() => registerMetadataWorkerOperation("probe", async (command) => ({
      kind: "probeResult",
      value: command.value,
    }))).toThrow("Worker operation уже зарегистрирована: probe")
  })

  it("rejects an unknown kind", async () => {
    await expect(runRegisteredMetadataWorkerOperation(
      { kind: "unknown" } as never,
      state,
    )).rejects.toThrow("Worker operation не зарегистрирована: unknown")
  })
})
