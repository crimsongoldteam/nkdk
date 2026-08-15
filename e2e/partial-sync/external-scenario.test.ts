import { expect, it } from "vitest"
import type { ScenarioBlock } from "./matrix/types"
import type { ScenarioMcpSession } from "./mcp-session"
import type { PartialSyncSteps } from "./steps"
import type { ScenarioWorkspace } from "./workspace"
import { runExternalPartialSyncScenario } from "./external-scenario"

it("opens one session for the whole scenario and closes it after success", async () => {
  const events: string[] = []
  const session = fakeSession(async () => { events.push("close") })
  const steps = fakeSteps()
  let receivedSession: ScenarioMcpSession | undefined
  let receivedSteps: PartialSyncSteps | undefined

  await runExternalPartialSyncScenario(params, {
    async openSession() {
      events.push("open")
      return session
    },
    createSteps(input) {
      events.push("create-steps")
      receivedSession = input.session
      return steps
    },
    async runScenario(input) {
      events.push("run")
      receivedSteps = input.steps
    },
  })

  expect(events).toEqual(["open", "create-steps", "run", "close"])
  expect(receivedSession).toBe(session)
  expect(receivedSteps).toBe(steps)
})

it("closes the only session when the scenario fails", async () => {
  const events: string[] = []
  const session = fakeSession(async () => { events.push("close") })

  await expect(runExternalPartialSyncScenario(params, {
    async openSession() {
      events.push("open")
      return session
    },
    createSteps: () => fakeSteps(),
    async runScenario() {
      events.push("run")
      throw new Error("scenario failed")
    },
  })).rejects.toThrow("scenario failed")

  expect(events).toEqual(["open", "run", "close"])
})

const workspace = {
  root: "/workspace",
  baseDir: "/workspace/base",
  dataDir: "/workspace/data",
  projectDir: "/workspace/project",
  checkpointsDir: "/workspace/checkpoints",
  verificationDir: "/workspace/verification",
  logsDir: "/workspace/logs",
  statePath: "/workspace/state.json",
} satisfies ScenarioWorkspace

const plan: readonly ScenarioBlock[] = []

const params = {
  workspace,
  plan,
  planHash: "a".repeat(64),
  mode: "standalone-server" as const,
}

function fakeSession(close: () => Promise<void>): ScenarioMcpSession {
  return {
    async call<T>(): Promise<T> { throw new Error("unexpected MCP call") },
    close,
  }
}

function fakeSteps(): PartialSyncSteps {
  return {
    async prepareBaseline() {},
    async executeBlock() {
      return { applyMs: 0, validationMs: 0, synchronizeMs: 0, unchangedMs: 0 }
    },
    async verifyFinalState() {},
  }
}
