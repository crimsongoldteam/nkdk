import { describe, expect, it, vi } from "vitest"
import type { FullXmlSyncResult } from "@nkdk/core"
import { compareSuccessfulSync } from "./metadata-project"

describe("compareSuccessfulSync", () => {
  it("не сравнивает деревья после неуспешного sync", async () => {
    const compare = vi.fn()

    await expect(compareSuccessfulSync({
      sync: syncResult([{ message: "Ошибка sync" }]),
      expectedDir: "/expected",
      actualDir: "/actual",
      reportDir: "/report",
      compare,
    })).resolves.toEqual({ kind: "syncFailed" })
    expect(compare).not.toHaveBeenCalled()
  })

  it("возвращает сравнение после успешного sync", async () => {
    const comparison = { equal: true, added: [], removed: [], changed: [] }
    const compare = vi.fn(async () => comparison)

    await expect(compareSuccessfulSync({
      sync: syncResult(),
      expectedDir: "/expected",
      actualDir: "/actual",
      reportDir: "/report",
      compare,
    })).resolves.toEqual({ kind: "compared", comparison })
    expect(compare).toHaveBeenCalledWith({
      expectedDir: "/expected",
      actualDir: "/actual",
      reportDir: "/report",
    })
  })
})

function syncResult(failed: readonly { message: string }[] = []): FullXmlSyncResult {
  return { succeeded: 1, failed, warnings: [], diagnostics: failed }
}
