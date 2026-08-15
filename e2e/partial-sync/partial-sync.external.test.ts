import { randomUUID } from "node:crypto"
import { join } from "node:path"
import { it } from "vitest"
import { openScenarioMcpSession } from "./mcp-session"
import { createPartialSyncSteps } from "./steps"
import { partialSyncMatrix } from "./matrix"
import { buildScenarioPlan, scenarioPlanHash } from "./plan"
import { runPartialSyncScenario } from "./scenario"
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
  const session = await openScenarioMcpSession({
    attemptLogDir: join(workspace.logsDir, `${randomUUID()}-scenario`),
  })
  try {
    await runPartialSyncScenario({
      workspace,
      plan,
      planHash,
      steps: createPartialSyncSteps({ workspace, session, mode }),
    })
  } finally {
    await session.close()
  }
}, 24 * 60 * 60 * 1000)
