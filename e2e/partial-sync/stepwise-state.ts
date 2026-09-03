import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
import type { PlatformMode } from "./concurrency"

export type StepwiseScenarioState = {
  readonly version: 1
  readonly scenario: "existing-partial-sync"
  readonly mode: PlatformMode
  readonly compatibilityHash: string
  readonly planHash: string
  readonly completedStepKey: string | null
  readonly completedStepIndex: number
  readonly attempt: number
  readonly checkpoint: "checkpoint/current.dt" | null
}

export function createInitialStepwiseState(params: {
  readonly mode: PlatformMode
  readonly compatibilityHash: string
  readonly planHash: string
}): StepwiseScenarioState {
  assertHash(params.compatibilityHash, "compatibilityHash")
  assertHash(params.planHash, "planHash")
  return {
    version: 1,
    scenario: "existing-partial-sync",
    mode: params.mode,
    compatibilityHash: params.compatibilityHash,
    planHash: params.planHash,
    completedStepKey: null,
    completedStepIndex: -1,
    attempt: 1,
    checkpoint: null,
  }
}

export function parseStepwiseState(value: unknown): StepwiseScenarioState {
  if (typeof value !== "object" || value === null) throw new Error("Повреждено состояние пошагового e2e")
  const state = value as Record<string, unknown>
  if (state["version"] !== 1 || state["scenario"] !== "existing-partial-sync" ||
    (state["mode"] !== "designer-agent" && state["mode"] !== "standalone-server") ||
    !isHash(state["compatibilityHash"]) || !isHash(state["planHash"]) ||
    !Number.isInteger(state["completedStepIndex"]) || Number(state["completedStepIndex"]) < -1 ||
    !Number.isInteger(state["attempt"]) || Number(state["attempt"]) < 1 ||
    (state["checkpoint"] !== null && state["checkpoint"] !== "checkpoint/current.dt")) {
    throw new Error("Повреждено или неизвестно состояние пошагового e2e")
  }
  const key = state["completedStepKey"]
  const index = Number(state["completedStepIndex"])
  const checkpoint = state["checkpoint"]
  if ((index === -1 && (key !== null || checkpoint !== null)) ||
    (index >= 0 && (typeof key !== "string" || key.length === 0 || checkpoint === null))) {
    throw new Error("несогласованы ключ, индекс и контрольная точка пошагового e2e")
  }
  return state as StepwiseScenarioState
}

export async function readStepwiseState(path: string): Promise<StepwiseScenarioState> {
  return parseStepwiseState(JSON.parse(await readFile(path, "utf8")))
}

export async function writeStepwiseState(path: string, state: StepwiseScenarioState): Promise<void> {
  parseStepwiseState(state)
  await mkdir(dirname(path), { recursive: true })
  const temporaryPath = `${path}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`)
  await rename(temporaryPath, path)
}

function assertHash(value: string, name: string): void {
  if (!isHash(value)) throw new Error(`${name} должен быть SHA-256`)
}

function isHash(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value)
}
