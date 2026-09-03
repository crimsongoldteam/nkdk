import { expect, it } from "vitest"
import { createStepwiseReportStore, type StepwiseReportIo } from "./stepwise-report"
import type { ScenarioResult } from "./stepwise-scenario"

it("группирует одинаковые сценарии по режимам и сохраняет историю попыток", async () => {
  const files = new Map<string, string>()
  const io: StepwiseReportIo = {
    async mkdir() {},
    async read(path) {
      const value = files.get(path)
      if (value === undefined) throw Object.assign(new Error("missing"), { code: "ENOENT" })
      return value
    },
    async write(path, value) { files.set(path, value) },
    async move(from, to) { files.set(to, files.get(from)!); files.delete(from) },
  }
  const store = createStepwiseReportStore("C:/run/reports", io)
  await Promise.all([
    store.record(result("designer-agent")),
    store.record(result("standalone-server")),
    store.record(result("designer-agent")),
  ])

  const report = await store.read()
  expect(report.scenarios["existing-partial-sync"].modes["designer-agent"].attempts).toHaveLength(2)
  expect(report.scenarios["existing-partial-sync"].modes["standalone-server"].attempts).toHaveLength(1)
  expect(files.get("C:/run/reports/report.md")).toContain("standalone-server")
})

function result(mode: ScenarioResult["mode"]): ScenarioResult {
  return {
    id: "existing-partial-sync", mode, status: "succeeded", completedSteps: 2,
    totalSteps: 2, durationMs: 10, attempt: 1, steps: [],
  }
}
