import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import type { BaselineReference } from "./baseline"
import type { InfobaseArchiveStore } from "./infobase-archive"
import type { ScenarioRunWorkspace } from "./stepwise-workspace"
import {
  publishStepCheckpoint,
  restoreStepCheckpoint,
} from "./stepwise-checkpoint"
import {
  createInitialStepwiseState,
  readStepwiseState,
  writeStepwiseState,
} from "./stepwise-state"
import type { ScenarioStep } from "./stepwise-plan"

const roots: string[] = []
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))) })

describe("stepwise checkpoint", () => {
  it("не продвигает state при ошибке dump", async () => {
    const fixture = await createFixture({ dumpError: new Error("planned") })

    await expect(publishStepCheckpoint(fixture.publishParams, fixture.dependencies))
      .rejects.toThrow("planned")

    expect(await readStepwiseState(fixture.workspace.statePath)).toEqual(fixture.initialState)
  })

  it("создаёт базу из dt и воспроизводит YAML до завершённого шага", async () => {
    const fixture = await createFixture()
    await writeFile(join(fixture.workspace.projectDir, "value.txt"), "1")
    const firstState = await publishStepCheckpoint(fixture.publishParams, fixture.dependencies)
    await writeFile(join(fixture.workspace.projectDir, "value.txt"), "2")
    const state = await publishStepCheckpoint({
      ...fixture.publishParams,
      state: firstState,
      step: fixture.steps[1],
      stepIndex: 1,
    }, fixture.dependencies)
    await writeFile(join(fixture.workspace.projectDir, "value.txt"), "broken")

    await restoreStepCheckpoint({
      workspace: fixture.workspace,
      baseline: fixture.baseline,
      state,
      steps: fixture.steps,
      mode: "designer-agent",
    }, fixture.dependencies)

    expect(await readFile(join(fixture.workspace.projectDir, "value.txt"), "utf8")).toBe("2")
    expect(fixture.calls).toContain("create-base:current.dt")
    expect(fixture.calls.filter((call) => call.startsWith("apply:")))
      .toEqual(["apply:step-0", "apply:step-1"])
  })
})

async function createFixture(options: { readonly dumpError?: Error } = {}) {
  const root = await mkdtemp(join(tmpdir(), "nkdk-stepwise-checkpoint-"))
  roots.push(root)
  const workspace: ScenarioRunWorkspace = {
    root,
    baseDir: join(root, "base"),
    dataDir: join(root, "data"),
    projectDir: join(root, "project"),
    checkpointDir: join(root, "checkpoint"),
    verificationDir: join(root, "verification"),
    logsDir: join(root, "logs"),
    statePath: join(root, "state.json"),
  }
  const baselineProject = join(root, "baseline-project")
  await Promise.all([workspace.projectDir, baselineProject].map((path) => mkdir(path, { recursive: true })))
  await writeFile(join(baselineProject, "value.txt"), "0")
  await writeFile(join(workspace.projectDir, "value.txt"), "2")
  const baselineArchive = join(root, "baseline.dt")
  await writeFile(baselineArchive, "baseline")
  const baseline: BaselineReference = {
    archivePath: baselineArchive,
    projectDir: baselineProject,
    manifest: {
      version: 2,
      compatibilityHash: "a".repeat(64),
      fixtureHashes: { cf: "b".repeat(64), cfe: "c".repeat(64) },
      platformVersion: "8.3.27.2214",
      nkdkBuildId: "build-1",
      archiveSha256: "d".repeat(64),
      projectSha256: "e".repeat(64),
    },
  }
  const steps = [step("step-0", "1"), step("step-1", "2")]
  const initialState = createInitialStepwiseState({
    mode: "designer-agent",
    compatibilityHash: baseline.manifest.compatibilityHash,
    planHash: "f".repeat(64),
  })
  await writeStepwiseState(workspace.statePath, initialState)
  const calls: string[] = []
  const archiveStore: InfobaseArchiveStore = {
    async create({ archivePath }) {
      calls.push(`create-base:${archivePath.split(/[\\/]/u).at(-1)}`)
      await mkdir(workspace.baseDir, { recursive: true })
      await writeFile(join(workspace.baseDir, "1Cv8.1CD"), "base")
      return { elapsedMs: 1, sizeBytes: 1, requiresReconnect: true }
    },
    async dump({ archivePath }) {
      if (options.dumpError !== undefined) throw options.dumpError
      await writeFile(archivePath, "checkpoint")
      return { elapsedMs: 1, sizeBytes: 10, requiresReconnect: true }
    },
    async restore() { throw new Error("unexpected restore") },
  }
  const dependencies = {
    archiveStore,
    operationId() { return "operation-1" },
    async applyStep(projectDir: string, scenarioStep: ScenarioStep) {
      calls.push(`apply:${scenarioStep.key}`)
      await writeFile(join(projectDir, "value.txt"), String(scenarioStep.operation.changes[0].after))
    },
    async writeProjectSettings() {},
  }
  return {
    workspace,
    baseline,
    steps,
    calls,
    initialState,
    dependencies,
    publishParams: {
      workspace,
      state: initialState,
      step: steps[0],
      stepIndex: 0,
      steps,
    },
  }
}

function step(key: string, after: string): ScenarioStep {
  return {
    key,
    layerKey: "layer",
    componentPath: "cf",
    sourceOperationKeys: [key],
    operation: {
      key,
      kind: "change",
      changes: [{ path: "value.txt", before: null, after }],
    },
  }
}
