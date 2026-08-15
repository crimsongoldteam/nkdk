import { randomUUID } from "node:crypto"
import { join } from "node:path"
import { it } from "vitest"
import { openScenarioMcpSession } from "./mcp-session"
import { createPartialSyncSteps } from "./steps"
import { partialSyncMatrix } from "./matrix"
import { recoveryProbeBlockKey } from "./matrix/layers"
import { buildScenarioPlan, scenarioPlanHash } from "./plan"
import { runScenarioWithRecoveryProbe } from "./recovery-probe"
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
  await runScenarioWithRecoveryProbe({
    workspace,
    plan,
    planHash,
    recoveryProbeBlockKey,
    timingReport: createScenarioTimingReport(workspace.logsDir),
    now: Date.now,
    async openAttempt(attemptWorkspace) {
      const session = await openScenarioMcpSession({
        attemptLogDir: join(attemptWorkspace.logsDir, `${randomUUID()}-scenario`),
      })
      return {
        steps: createPartialSyncSteps({ workspace: attemptWorkspace, session, mode }),
        close: () => session.close(),
      }
    },
    reopenWorkspace: () => openScenarioWorkspace(root, { planHash, reset: false }),
  })
}, 24 * 60 * 60 * 1000)
