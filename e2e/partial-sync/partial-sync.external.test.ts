import { it } from "vitest"
import { runExternalPartialSyncScenario } from "./external-scenario"
import { partialSyncMatrix } from "./matrix"
import { buildScenarioPlan, scenarioPlanHash } from "./plan"
import { createScenarioTimingReport } from "./timing"
import { openScenarioWorkspace } from "./workspace"

it("последовательно синхронизирует полную матрицу метаданных с продолжением", async () => {
  const root = process.env["NKDK_PARTIAL_SYNC_ROOT"]
  if (root === undefined) throw new Error("NKDK_PARTIAL_SYNC_ROOT не задан")
  const mode = process.env["NKDK_PARTIAL_SYNC_MODE"]
  if (mode !== "designer-agent" && mode !== "standalone-server") {
    throw new Error("NKDK_PARTIAL_SYNC_MODE должен быть designer-agent или standalone-server")
  }
  const plan = buildScenarioPlan(partialSyncMatrix)
  const planHash = scenarioPlanHash(plan)
  const workspace = await openScenarioWorkspace(root, {
    planHash,
    reset: process.env["NKDK_PARTIAL_SYNC_RESET"] === "1",
  })
  await runExternalPartialSyncScenario({
    workspace,
    plan,
    planHash,
    mode,
    timingReport: createScenarioTimingReport(workspace.logsDir),
    now: Date.now,
  })
}, 24 * 60 * 60 * 1000)
