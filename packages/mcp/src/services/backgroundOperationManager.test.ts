import { describe, expect, it, vi } from "vitest"
import type { BackgroundOperationSnapshot } from "../contracts/backgroundOperations"
import type { BackgroundOperationStore } from "./backgroundOperationStore"
import { createBackgroundOperationManager, type BackgroundOperationRunners } from "./backgroundOperationManager"

const validationResult = {
  ok: true as const,
  diagnostics: [],
  summary: { errors: 0, warnings: 0, shown: 0, omitted: 0 },
  truncated: false,
}

describe("background operation manager", () => {
  it("returns accepted before a delayed runner completes and persists its result", async () => {
    const deferred = createDeferred<typeof validationResult>()
    const fixture = managerFixture(async (_input, context) => {
      await context.report({ stage: "validation" })
      return deferred.promise
    })

    const accepted = await fixture.manager.start("validate_project", { projectDir: "C:/project" })

    expect(accepted).toMatchObject({ status: "accepted", operationKind: "validate_project" })
    await eventually(async () => {
      expect(await fixture.manager.get("C:/project", accepted.operationId)).toMatchObject({
        ok: true,
        status: "running",
        stage: "validation",
      })
    })
    deferred.resolve(validationResult)
    await eventually(async () => {
      expect(await fixture.manager.get("C:/project", accepted.operationId)).toMatchObject({
        status: "succeeded",
        result: validationResult,
      })
    })
  })

  it("cancels through the operation controller", async () => {
    const fixture = managerFixture(async (_input, { signal }) => {
      await new Promise<void>((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new DOMException("cancelled", "AbortError")), { once: true })
      })
      return validationResult
    })
    const accepted = await fixture.manager.start("validate_project", { projectDir: "C:/project" })

    await eventually(async () => {
      expect((await fixture.manager.get("C:/project", accepted.operationId))?.status).toBe("running")
    })
    await fixture.manager.cancel("C:/project", accepted.operationId)

    await eventually(async () => {
      expect((await fixture.manager.get("C:/project", accepted.operationId))?.status).toBe("cancelled")
    })
  })

  it("normalizes thrown failures", async () => {
    const fixture = managerFixture(async () => { throw new Error("broken") })
    const accepted = await fixture.manager.start("validate_project", { projectDir: "C:/project" })

    await eventually(async () => {
      expect(await fixture.manager.get("C:/project", accepted.operationId)).toMatchObject({
        status: "failed",
        error: { code: "operation_failed", message: "broken" },
      })
    })
  })

  it("recovers and cleans a project before accepting work", async () => {
    const fixture = managerFixture(async () => validationResult)

    await fixture.manager.start("validate_project", { projectDir: "C:/project" })

    expect(fixture.store.recover).toHaveBeenCalledOnce()
    expect(fixture.store.cleanup).toHaveBeenCalledOnce()
  })
})

function managerFixture(
  run: BackgroundOperationRunners["validate_project"]["run"],
) {
  const records = new Map<string, BackgroundOperationSnapshot>()
  const store: BackgroundOperationStore = {
    write: vi.fn(async (snapshot) => { records.set(snapshot.operationId, snapshot) }),
    read: vi.fn(async (_projectDir, operationId) => records.get(operationId)),
    recover: vi.fn(async () => undefined),
    cleanup: vi.fn(async () => undefined),
  }
  let sequence = 0
  const manager = createBackgroundOperationManager({
    runners: { validate_project: { run } } as BackgroundOperationRunners,
    store,
    operationId: () => `operation-${++sequence}`,
    now: () => new Date("2026-08-30T00:00:00.000Z"),
  })
  return { manager, store }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((fulfill) => { resolve = fulfill })
  return { promise, resolve }
}

async function eventually(assertion: () => void | Promise<void>): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await assertion()
      return
    } catch (error) {
      if (attempt === 19) throw error
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }
}
