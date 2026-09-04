import { join, resolve } from "node:path"
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
  const store = createStepwiseReportStore(reportsDir, io, metadata)
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
  expect(files.get(store.markdownPath)).toContain("standalone-server")
  expect(files.get(store.markdownPath)).toContain("abc123")
  expect(files.get(store.markdownPath))
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
  const store = createStepwiseReportStore(reportsDir, io)

  await store.recordEvent({
    id: "existing-partial-sync", mode: "designer-agent", attempt: 1,
    kind: "stage-completed", stepKey: "step", stage: "validation", durationMs: 5,
    attemptLogDir: join(runRoot, "scenarios", "designer-agent", "logs", "step"),
  })

  const report = await store.read()
  expect(report.events).toEqual([expect.objectContaining({
    kind: "stage-completed", stage: "validation", durationMs: 5,
    attemptLogDir: "scenarios/designer-agent/logs/step",
  })])
  expect(files.get(store.markdownPath)).toContain("validation")
  expect(files.get(store.markdownPath))
    .toContain("[журнал](<../scenarios/designer-agent/logs/step>)")
  expect(files.has(`${store.jsonPath}.tmp`)).toBe(false)
})

it("однократно восстанавливает незавершённую попытку как interrupted", async () => {
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
  const store = createStepwiseReportStore(reportsDir, io)
  await store.recordEvent({
    id: "existing-partial-sync", mode: "designer-agent", attempt: 3, kind: "started",
  })
  await store.recordEvent({
    id: "existing-partial-sync", mode: "designer-agent", attempt: 3,
    kind: "stage-completed", stepKey: "step-3", stage: "validation", durationMs: 5,
    attemptLogDir: join(runRoot, "scenarios", "designer-agent", "logs", "step-3"),
  })

  const recovery = {
    id: "existing-partial-sync" as const,
    mode: "designer-agent" as const,
    attempt: 3,
    completedSteps: 2,
    totalSteps: 10,
  }
  await store.recoverInterruptedAttempt(recovery)
  await store.recoverInterruptedAttempt(recovery)

  const report = await store.read()
  expect(report.scenarios["existing-partial-sync"].modes["designer-agent"].attempts).toEqual([
    expect.objectContaining({
      status: "interrupted", attempt: 3, completedSteps: 2, totalSteps: 10, durationMs: 5,
      steps: [expect.objectContaining({
        stepKey: "step-3",
        stageTimings: { validation: 5 },
        attemptLogDir: "scenarios/designer-agent/logs/step-3",
      })],
    }),
  ])
  expect(report.events?.filter(({ kind }) => kind === "interrupted")).toHaveLength(1)
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
      attemptLogDir: join(runRoot, "scenarios", mode, "logs", "step"),
    }],
  }
}

const runRoot = resolve("/run")
const reportsDir = join(runRoot, "reports")
