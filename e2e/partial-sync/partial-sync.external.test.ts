import { it } from "vitest"
import { createPartialSyncSteps } from "./steps"
import { runPartialSyncScenario } from "./scenario"
import { openScenarioWorkspace } from "./workspace"

it("синхронизирует справочник и реквизит с продолжением", async () => {
  const root = process.env["NKDK_PARTIAL_SYNC_ROOT"]
  if (root === undefined) throw new Error("NKDK_PARTIAL_SYNC_ROOT не задан")
  const workspace = await openScenarioWorkspace(root)
  await runPartialSyncScenario(workspace, createPartialSyncSteps({ workspace }))
}, 60 * 60 * 1000)
