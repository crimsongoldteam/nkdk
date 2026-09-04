import { randomUUID } from "node:crypto"
import { execFile } from "node:child_process"
import { availableParallelism, freemem } from "node:os"
import { lstat, rm } from "node:fs/promises"
import { isAbsolute, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { promisify } from "node:util"
import { prepareOrReuseBaseline, hashFileTree, type BaselineReference } from "./baseline"
import {
  resolveConcurrency,
  runModeJobsWithConcurrency,
  type ConcurrencySetting,
  type ConcurrencySettings,
  type PlatformMode,
} from "./concurrency"
import { createInfobaseArchiveStore } from "./infobase-archive"
import { partialSyncMatrix } from "./matrix"
import { openScenarioMcpSession } from "./mcp-session"
import { writeProjectSettings } from "./project-settings"
import {
  createStepwiseReportStore,
  type StepwiseProgressEvent,
  type StepwiseRunMetadata,
} from "./stepwise-report"
import {
  bindStepwiseCheckpointDependencies,
  runStepwiseScenario,
  type ScenarioResult,
} from "./stepwise-scenario"
import { createStepwiseSteps, applyStepwiseOperation } from "./stepwise-steps"
import { createInitialStepwiseState, readStepwiseState, writeStepwiseState } from "./stepwise-state"
import { buildStepwisePlan, stepwisePlanHash } from "./stepwise-plan"
import { openStepwiseRunWorkspace, type StepwiseRunWorkspace } from "./stepwise-workspace"

export type StepwiseArgs = {
  readonly root: string
  readonly reset: boolean
  readonly concurrency: ConcurrencySettings
  readonly modes: readonly PlatformMode[]
}

export type StepwiseRunOutcome = {
  readonly scenarios: readonly ScenarioResult[]
  readonly reportJsonPath: string
  readonly reportMarkdownPath: string
}

export type StepwiseRunDependencies = {
  resources(): { readonly cpuCount: number; readonly availableMemoryBytes: number }
  sourceRevision(): Promise<string>
  openWorkspace(root: string): Promise<StepwiseRunWorkspace>
  resetWorkspace(workspace: StepwiseRunWorkspace): Promise<void>
  prepareBaseline(params: {
    readonly workspace: StepwiseRunWorkspace
    readonly mode: PlatformMode
    readonly signal: AbortSignal
  }): Promise<BaselineReference>
  recoverInterruptedAttempts(params: {
    readonly workspace: StepwiseRunWorkspace
    readonly modes: readonly PlatformMode[]
    readonly baseline: BaselineReference
    readonly totalSteps: number
    readonly metadata: StepwiseRunMetadata
  }): Promise<void>
  runMode(params: {
    readonly mode: PlatformMode
    readonly workspace: StepwiseRunWorkspace
    readonly baseline: BaselineReference
    readonly signal: AbortSignal
    readonly onEvent: (event: StepwiseProgressEvent) => Promise<void>
  }): Promise<ScenarioResult>
  record(reportDir: string, result: ScenarioResult, metadata: StepwiseRunMetadata): Promise<void>
  recordEvent(reportDir: string, event: StepwiseProgressEvent, metadata: StepwiseRunMetadata): Promise<void>
}

export function parseStepwiseArgs(argv: readonly string[]): StepwiseArgs {
  let root: string | undefined
  let reset = false
  const modes: PlatformMode[] = []
  const seenSettings = new Set<string>()
  const concurrency: { total: ConcurrencySetting; designerAgent: ConcurrencySetting; standaloneServer: ConcurrencySetting } = {
    total: "auto", designerAgent: "auto", standaloneServer: "auto",
  }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (index === 0 && argument === "--") continue
    if (argument === "--reset") {
      if (reset) throw new Error("Аргумент --reset можно передать только один раз")
      reset = true
      continue
    }
    if (argument === "--root") {
      if (root !== undefined) throw new Error("Аргумент --root можно передать только один раз")
      const value = requireValue(argv, index, argument)
      if (!isAbsolute(value)) throw new Error("Аргумент --root должен содержать абсолютный путь")
      root = resolve(value)
      index += 1
      continue
    }
    if (argument === "--mode") {
      const value = requireValue(argv, index, argument)
      if (value !== "designer-agent" && value !== "standalone-server") {
        throw new Error("Аргумент --mode требует designer-agent или standalone-server")
      }
      if (modes.includes(value)) throw new Error(`Режим ${value} указан повторно`)
      modes.push(value)
      index += 1
      continue
    }
    const setting = settingName(argument)
    if (setting !== undefined) {
      if (seenSettings.has(argument)) throw new Error(`Аргумент ${argument} можно передать только один раз`)
      seenSettings.add(argument)
      concurrency[setting] = parseConcurrency(requireValue(argv, index, argument), argument)
      index += 1
      continue
    }
    throw new Error(`Неизвестный аргумент: ${argument}`)
  }
  if (root === undefined) throw new Error("Не задан обязательный аргумент --root")
  return {
    root,
    reset,
    concurrency,
    modes: modes.length === 0 ? ["designer-agent", "standalone-server"] : modes,
  }
}

export async function runStepwiseCli(
  argv: readonly string[],
  dependencies: StepwiseRunDependencies = nodeDependencies,
  signal: AbortSignal = new AbortController().signal,
): Promise<StepwiseRunOutcome> {
  const args = parseStepwiseArgs(argv)
  const limits = resolveConcurrency(args.concurrency, dependencies.resources())
  const activeModes = args.modes.filter((mode) =>
    mode === "designer-agent" ? limits.designerAgent > 0 : limits.standaloneServer > 0)
  if (activeModes.length === 0) throw new Error("Все выбранные режимы отключены нулевым пределом")
  let workspace = await dependencies.openWorkspace(args.root)
  if (args.reset) {
    await dependencies.resetWorkspace(workspace)
    workspace = await dependencies.openWorkspace(args.root)
  }
  signal.throwIfAborted()
  const baseline = await dependencies.prepareBaseline({ workspace, mode: activeModes[0], signal })
  signal.throwIfAborted()
  const jobs = activeModes.map((mode) => ({ mode }))
  const metadata: StepwiseRunMetadata = {
    sourceRevision: await dependencies.sourceRevision(),
    mcpBuildId: baseline.manifest.nkdkBuildId,
    platformVersion: baseline.manifest.platformVersion,
    compatibilityHash: baseline.manifest.compatibilityHash,
    concurrency: limits,
    scenarioIds: jobs.map(({ mode }) => `${mode}/existing-partial-sync`),
  }
  await dependencies.recoverInterruptedAttempts({
    workspace,
    modes: activeModes,
    baseline,
    totalSteps: buildStepwisePlan(partialSyncMatrix).length,
    metadata,
  })
  let reportQueue = Promise.resolve()
  const recordScenario = (scenario: ScenarioResult): Promise<void> => {
    const operation = reportQueue.then(() =>
      dependencies.record(workspace.reportsDir, scenario, metadata))
    reportQueue = operation.catch(() => undefined)
    return operation
  }
  const recordEvent = (event: StepwiseProgressEvent): Promise<void> => {
    const operation = reportQueue.then(() =>
      dependencies.recordEvent(workspace.reportsDir, event, metadata))
    reportQueue = operation.catch(() => undefined)
    return operation
  }
  const settled = await runModeJobsWithConcurrency(jobs, limits, async ({ mode }) => {
    let scenario: ScenarioResult
    try {
      scenario = await dependencies.runMode({ mode, workspace, baseline, signal, onEvent: recordEvent })
    } catch (caught) {
      scenario = terminalInfrastructureResult(
        mode,
        caught instanceof Error ? caught : new Error(String(caught)),
        signal.aborted ? "interrupted" : "failed",
      )
    }
    await recordScenario(scenario)
    return scenario
  })
  const scenarios: ScenarioResult[] = []
  for (let index = 0; index < settled.length; index += 1) {
    const outcome = settled[index]
    const scenario = outcome.status === "succeeded"
      ? outcome.value
      : terminalInfrastructureResult(activeModes[index], outcome.error, signal.aborted ? "interrupted" : "failed")
    scenarios.push(scenario)
  }
  return {
    scenarios,
    reportJsonPath: `${workspace.reportsDir.replace(/[\\/]$/u, "")}/report.json`,
    reportMarkdownPath: `${workspace.reportsDir.replace(/[\\/]$/u, "")}/report.md`,
  }
}

function requireValue(argv: readonly string[], index: number, argument: string): string {
  const value = argv[index + 1]
  if (value === undefined || value.startsWith("--")) throw new Error(`Аргумент ${argument} требует значение`)
  return value
}

function settingName(argument: string): "total" | "designerAgent" | "standaloneServer" | undefined {
  if (argument === "--workers") return "total"
  if (argument === "--designer-workers") return "designerAgent"
  if (argument === "--standalone-workers") return "standaloneServer"
  return undefined
}

function parseConcurrency(value: string, argument: string): ConcurrencySetting {
  if (value === "auto") return value
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`Аргумент ${argument} требует целое число или auto`)
  return parsed
}

function terminalInfrastructureResult(
  mode: PlatformMode,
  error: Error,
  status: "failed" | "interrupted",
): ScenarioResult {
  return {
    id: "existing-partial-sync", mode, status, completedSteps: 0, totalSteps: 0,
    durationMs: 0, attempt: 1, steps: [], failure: { category: "infrastructure", message: error.message },
  }
}

const repositoryRoot = resolve(import.meta.dirname, "../..")
const fixturesRoot = join(repositoryRoot, "e2e", "fixtures", "xml")
const extensionName = "Расширение_All"
const execFileAsync = promisify(execFile)

const nodeDependencies: StepwiseRunDependencies = {
  resources: () => ({ cpuCount: availableParallelism(), availableMemoryBytes: freemem() }),
  async sourceRevision() {
    const result = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot })
    return result.stdout.trim()
  },
  openWorkspace: openStepwiseRunWorkspace,
  async resetWorkspace(workspace) { await rm(workspace.root, { recursive: true, force: true }) },
  async prepareBaseline({ workspace, mode, signal }) {
    return prepareOrReuseBaseline({
      baselineDir: workspace.baselineDir,
      cfXmlDir: join(fixturesRoot, "cf"),
      extensionXmlDir: join(fixturesRoot, "cfe", "all-extension"),
      extensionName,
      mode,
      nkdkBuildId: await hashFileTree(join(repositoryRoot, "packages", "mcp", "dist")),
      writeProgress(message) { process.stdout.write(`${message}\n`) },
      signal,
    })
  },
  async recoverInterruptedAttempts({ workspace, modes, baseline, totalSteps, metadata }) {
    const expectedPlanHash = stepwisePlanHash(buildStepwisePlan(partialSyncMatrix))
    const store = createStepwiseReportStore(workspace.reportsDir, undefined, metadata)
    for (const mode of modes) {
      const scenarioWorkspace = workspace.scenario(mode)
      if (!await pathExists(scenarioWorkspace.statePath)) continue
      const state = await readStepwiseState(scenarioWorkspace.statePath)
      if (state.mode !== mode || state.planHash !== expectedPlanHash ||
        state.compatibilityHash !== baseline.manifest.compatibilityHash) continue
      await store.recoverInterruptedAttempt({
        id: state.scenario,
        mode,
        attempt: state.attempt,
        completedSteps: state.completedStepIndex + 1,
        totalSteps,
      })
    }
  },
  async runMode({ mode, workspace: runWorkspace, baseline, signal, onEvent }) {
    signal.throwIfAborted()
    const workspace = runWorkspace.scenario(mode)
    const steps = buildStepwisePlan(partialSyncMatrix)
    const planHash = stepwisePlanHash(steps)
    let state
    if (await pathExists(workspace.statePath)) {
      const stored = await readStepwiseState(workspace.statePath)
      if (stored.mode !== mode || stored.planHash !== planHash ||
        stored.compatibilityHash !== baseline.manifest.compatibilityHash) {
        throw new Error(`Состояние ${mode} несовместимо с текущим планом или эталоном`)
      }
      state = { ...stored, attempt: stored.attempt + 1 }
    } else {
      state = createInitialStepwiseState({ mode, planHash, compatibilityHash: baseline.manifest.compatibilityHash })
    }
    await writeStepwiseState(workspace.statePath, state)
    const event = (value: Omit<StepwiseProgressEvent, "id" | "mode" | "attempt">) => onEvent({
      id: "existing-partial-sync", mode, attempt: state.attempt, ...value,
    })
    await event({ kind: "started" })
    const session = await openScenarioMcpSession({ attemptLogDir: join(workspace.logsDir, `scenario-${state.attempt}`) })
    const closeOnAbort = () => { void session.close() }
    signal.addEventListener("abort", closeOnAbort, { once: true })
    const archiveStore = createInfobaseArchiveStore(async () => {
      await session.call("nkdk.close_platform_connection", { projectDir: workspace.projectDir }, { attemptLogDir: workspace.logsDir })
    })
    const checkpointDependencies = {
      archiveStore,
      operationId: randomUUID,
      applyStep: applyStepwiseOperation,
      writeProjectSettings,
    }
    const executor = createStepwiseSteps({
      workspace, session, mode, baselineProjectDir: baseline.projectDir, extensionName,
      recordStage: (value) => event({ kind: "stage-completed", ...value }),
    })
    try {
      return await runStepwiseScenario({
        id: "existing-partial-sync", mode, workspace, baseline, state, steps,
      }, {
        now: Date.now,
        ...bindStepwiseCheckpointDependencies(checkpointDependencies),
        execute: executor.execute,
        recordCheckpoint: (step, attemptLogDir) => event({
          kind: "checkpoint-published", stepKey: step.key, attemptLogDir,
        }),
      }, signal)
    } finally {
      signal.removeEventListener("abort", closeOnAbort)
      await session.close()
    }
  },
  async record(reportDir, result, metadata) {
    await createStepwiseReportStore(reportDir, undefined, metadata).record(result)
  },
  async recordEvent(reportDir, event, metadata) {
    await createStepwiseReportStore(reportDir, undefined, metadata).recordEvent(event)
  },
}

async function pathExists(path: string): Promise<boolean> {
  try { await lstat(path); return true }
  catch (caught) {
    if (caught instanceof Error && "code" in caught && caught.code === "ENOENT") return false
    throw caught
  }
}

const isCliEntrypoint = process.argv[1] !== undefined &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url

if (isCliEntrypoint) {
  const controller = new AbortController()
  const interrupt = () => controller.abort(new Error("Выполнение прервано пользователем"))
  process.once("SIGINT", interrupt)
  process.once("SIGTERM", interrupt)
  runStepwiseCli(process.argv.slice(2), nodeDependencies, controller.signal).then((outcome) => {
    process.stdout.write(`JSON: ${outcome.reportJsonPath}\nMarkdown: ${outcome.reportMarkdownPath}\n`)
    if (outcome.scenarios.some(({ status }) => status !== "succeeded")) process.exitCode = 1
  }).catch((caught: unknown) => {
    process.stderr.write(`${caught instanceof Error ? caught.message : String(caught)}\n`)
    process.exitCode = 1
  }).finally(() => {
    process.removeListener("SIGINT", interrupt)
    process.removeListener("SIGTERM", interrupt)
  })
}
