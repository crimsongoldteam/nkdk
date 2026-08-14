import { it } from "vitest"
import { createPartialSyncSteps } from "./steps"
import { partialSyncMatrix } from "./matrix"
import { buildScenarioPlan, scenarioPlanHash } from "./plan"
import { runPartialSyncScenario } from "./scenario"
import { openScenarioWorkspace } from "./workspace"

it("последовательно синхронизирует полную матрицу метаданных с продолжением", async () => {
  const root = process.env["NKDK_PARTIAL_SYNC_ROOT"]
  if (root === undefined) throw new Error("NKDK_PARTIAL_SYNC_ROOT не задан")
  const plan = buildScenarioPlan(partialSyncMatrix)
  const planHash = scenarioPlanHash(plan)
  const workspace = await openScenarioWorkspace(root, {
    planHash,
    reset: process.env["NKDK_PARTIAL_SYNC_RESET"] === "1",
  })
  await runPartialSyncScenario({
    workspace,
    plan,
    planHash,
    steps: createPartialSyncSteps({ workspace }),
  })
}, 24 * 60 * 60 * 1000)
