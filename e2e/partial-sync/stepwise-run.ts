import { randomUUID } from "node:crypto"
import { availableParallelism, freemem } from "node:os"
import { lstat, rm } from "node:fs/promises"
import { isAbsolute, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
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
import { createStepwiseReportStore } from "./stepwise-report"
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
  openWorkspace(root: string): Promise<StepwiseRunWorkspace>
  resetWorkspace(workspace: StepwiseRunWorkspace): Promise<void>
  prepareBaseline(params: {
    readonly workspace: StepwiseRunWorkspace
    readonly mode: PlatformMode
  }): Promise<BaselineReference>
  runMode(params: {
    readonly mode: PlatformMode
    readonly workspace: StepwiseRunWorkspace
    readonly baseline: BaselineReference
  }): Promise<ScenarioResult>
  record(reportDir: string, result: ScenarioResult): Promise<void>
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
): Promise<StepwiseRunOutcome> {
  const args = parseStepwiseArgs(argv)
  let workspace = await dependencies.openWorkspace(args.root)
  if (args.reset) {
    await dependencies.resetWorkspace(workspace)
    workspace = await dependencies.openWorkspace(args.root)
  }
  const baseline = await dependencies.prepareBaseline({ workspace, mode: args.modes[0] })
  const limits = resolveConcurrency(args.concurrency, dependencies.resources())
  const jobs = args.modes.map((mode) => ({ mode }))
  const settled = await runModeJobsWithConcurrency(jobs, limits, ({ mode }) =>
    dependencies.runMode({ mode, workspace, baseline }))
  const scenarios: ScenarioResult[] = []
  for (let index = 0; index < settled.length; index += 1) {
    const outcome = settled[index]
    const scenario = outcome.status === "succeeded"
      ? outcome.value
      : infrastructureFailure(args.modes[index], outcome.error)
    scenarios.push(scenario)
    await dependencies.record(workspace.reportsDir, scenario)
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

function infrastructureFailure(mode: PlatformMode, error: Error): ScenarioResult {
  return {
    id: "existing-partial-sync", mode, status: "failed", completedSteps: 0, totalSteps: 0,
    durationMs: 0, attempt: 1, steps: [], failure: { category: "infrastructure", message: error.message },
  }
}

const repositoryRoot = resolve(import.meta.dirname, "../..")
const fixturesRoot = join(repositoryRoot, "e2e", "fixtures", "xml")
const extensionName = "Расширение_All"

const nodeDependencies: StepwiseRunDependencies = {
  resources: () => ({ cpuCount: availableParallelism(), availableMemoryBytes: freemem() }),
  openWorkspace: openStepwiseRunWorkspace,
  async resetWorkspace(workspace) { await rm(workspace.root, { recursive: true, force: true }) },
  async prepareBaseline({ workspace, mode }) {
    return prepareOrReuseBaseline({
      baselineDir: workspace.baselineDir,
      cfXmlDir: join(fixturesRoot, "cf"),
      extensionXmlDir: join(fixturesRoot, "cfe", "all-extension"),
      extensionName,
      mode,
      nkdkBuildId: await hashFileTree(join(repositoryRoot, "packages", "mcp", "dist")),
    })
  },
  async runMode({ mode, workspace: runWorkspace, baseline }) {
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
    const session = await openScenarioMcpSession({ attemptLogDir: join(workspace.logsDir, `scenario-${state.attempt}`) })
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
    })
    try {
      return await runStepwiseScenario({
        id: "existing-partial-sync", mode, workspace, baseline, state, steps,
      }, {
        now: Date.now,
        ...bindStepwiseCheckpointDependencies(checkpointDependencies),
        execute: executor.execute,
      })
    } finally {
      await session.close()
    }
  },
  async record(reportDir, result) { await createStepwiseReportStore(reportDir).record(result) },
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
  runStepwiseCli(process.argv.slice(2)).then((outcome) => {
    process.stdout.write(`JSON: ${outcome.reportJsonPath}\nMarkdown: ${outcome.reportMarkdownPath}\n`)
    if (outcome.scenarios.some(({ status }) => status !== "succeeded")) process.exitCode = 1
  }).catch((caught: unknown) => {
    process.stderr.write(`${caught instanceof Error ? caught.message : String(caught)}\n`)
    process.exitCode = 1
  })
}
