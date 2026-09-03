import { expect, it } from "vitest"
import {
  createStepwiseReportStore,
  type StepwiseReportIo,
  type StepwiseRunMetadata,
} from "./stepwise-report"
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
  const metadata: StepwiseRunMetadata = {
    sourceRevision: "abc123",
    mcpBuildId: "mcp-hash",
    platformVersion: "8.3.27.2214",
    compatibilityHash: "baseline-hash",
    concurrency: { total: 2, designerAgent: 1, standaloneServer: 1 },
    scenarioIds: ["designer-agent/existing-partial-sync", "standalone-server/existing-partial-sync"],
  }
  const store = createStepwiseReportStore("C:/run/reports", io, metadata)
  await Promise.all([
    store.record(result("designer-agent", 1)),
    store.record(result("standalone-server")),
    store.record(result("designer-agent", 2)),
  ])

  const report = await store.read()
  expect(report.scenarios["existing-partial-sync"].modes["designer-agent"].attempts).toHaveLength(2)
  expect(report.scenarios["existing-partial-sync"].modes["standalone-server"].attempts).toHaveLength(1)
  expect(report.run).toEqual(metadata)
  expect(report.summary).toEqual({
    successfulSteps: 4,
    failedSteps: 0,
    interruptedSteps: 0,
    notRunSteps: 0,
  })
  expect(report.scenarios["existing-partial-sync"].modes["designer-agent"].attempts[0]
    .steps[0]?.attemptLogDir).toBe("scenarios/designer-agent/logs/step")
  expect(files.get("C:/run/reports/report.md")).toContain("standalone-server")
  expect(files.get("C:/run/reports/report.md")).toContain("abc123")
  expect(files.get("C:/run/reports/report.md"))
    .toContain("[журнал](<../scenarios/designer-agent/logs/step>)")
})

it("атомарно сохраняет ход активной попытки до её терминального результата", async () => {
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

  await store.recordEvent({
    id: "existing-partial-sync", mode: "designer-agent", attempt: 1,
    kind: "stage-completed", stepKey: "step", stage: "validation", durationMs: 5,
    attemptLogDir: "C:/run/scenarios/designer-agent/logs/step",
  })

  const report = await store.read()
  expect(report.events).toEqual([expect.objectContaining({
    kind: "stage-completed", stage: "validation", durationMs: 5,
    attemptLogDir: "scenarios/designer-agent/logs/step",
  })])
  expect(files.get("C:/run/reports/report.md")).toContain("validation")
  expect(files.get("C:/run/reports/report.md"))
    .toContain("[журнал](<../scenarios/designer-agent/logs/step>)")
  expect(files.has("C:/run/reports/report.json.tmp")).toBe(false)
})

function result(mode: ScenarioResult["mode"], attempt = 1): ScenarioResult {
  return {
    id: "existing-partial-sync", mode, status: "succeeded", completedSteps: 2,
    totalSteps: 2, durationMs: 10, attempt, steps: [{
      stepKey: "step",
      stageTimings: {
        apply: 1, validation: 1, sync: 1, verificationImport: 1,
        verificationValidation: 1, comparison: 1, unchanged: 1,
      },
      attemptLogDir: `C:/run/scenarios/${mode}/logs/step`,
    }],
  }
}
