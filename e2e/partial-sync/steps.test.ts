import { mkdtemp, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import type { ScenarioBlock, ScenarioOperation } from "./matrix/types"
import { applyScenarioBlock } from "./operation"
import {
  createPartialSyncSteps,
  type PartialSyncStepDependencies,
} from "./steps"
import { openScenarioWorkspace } from "./workspace"

const planHash = "a".repeat(64)

describe("partial sync steps", () => {
  it("uses one MCP session for consecutive operations and verifies only at the end", async () => {
    const fixture = await createFixture()
    const steps = createPartialSyncSteps(
      { workspace: fixture.workspace, session: fixture.session, mode: "standalone-server" },
      fixture.dependencies
    )

    await steps.prepareBaseline()
    await steps.executeBlock(testBlock([testOperation()]), { index: 1, total: 2 })
    await steps.executeBlock(testBlock([testOperation("object:second")], "objects:bulk"), { index: 2, total: 2 })
    await steps.verifyFinalState()

    expect(fixture.openSessionCalls()).toBe(0)
    const names = fixture.calls.map(([name]) => name)
    expect(names.slice(
      names.indexOf("nkdk.sync_to_infobase"),
      names.lastIndexOf("nkdk.sync_to_infobase") + 1,
    )).not.toContain("nkdk.close_platform_connection")
    const verificationProjectDir = join(fixture.workspace.verificationDir, "current")
    expect(fixture.calls.filter(([name]) => name === "nkdk.close_platform_connection"))
      .toEqual([
        ["nkdk.close_platform_connection", { projectDir: fixture.workspace.projectDir }],
        ["nkdk.close_platform_connection", { projectDir: verificationProjectDir }],
      ])
    expect(fixture.calls
      .filter(([name]) => name === "nkdk.import_from_infobase")
      .map(([, input]) => input.componentPath))
      .toEqual(["cf", "cfe/Расширение_All", "cf", "cfe/Расширение_All"])
    expect(fixture.comparisons.map(({ expectedDir }) => expectedDir)).toEqual([
      join(fixture.workspace.projectDir, "cf"),
      join(fixture.workspace.projectDir, "cfe/Расширение_All"),
    ])
  })

  it("imports both configuration components through public MCP", async () => {
    const fixture = await createFixture()
    const steps = createPartialSyncSteps(
      { workspace: fixture.workspace, session: fixture.session, mode: "standalone-server" },
      fixture.dependencies
    )

    await steps.prepareBaseline()

    expect(fixture.calls).toEqual([
      ["nkdk.import_from_infobase", {
        projectDir: fixture.workspace.projectDir,
        componentPath: "cf",
        allowWrite: true,
      }],
      ["nkdk.import_from_infobase", {
        projectDir: fixture.workspace.projectDir,
        componentPath: "cfe/Расширение_All",
        allowWrite: true,
      }],
    ])
    expect(fixture.comparisons).toEqual([])
    const settings = await readFile(join(fixture.workspace.projectDir, ".nkdk/project.yaml"), "utf8")
    expect(settings).toContain("mode: standalone-server")
  })

  it("applies a multi-operation block, validates once and synchronizes twice", async () => {
    const fixture = await createFixture({ nowValues: [1_000, 2_000, 4_000, 7_000, 13_340] })
    const steps = createPartialSyncSteps(
      { workspace: fixture.workspace, session: fixture.session, mode: "standalone-server" },
      fixture.dependencies
    )
    const block = testBlock([
      testOperation(),
      testOperation("object:second"),
      testOperation("object:third"),
    ])

    await steps.executeBlock(block, { index: 3, total: 12 })

    await expect(readFile(join(
      fixture.workspace.projectDir,
      "cf/Справочник/Проверочный/Свойства.yaml",
    ), "utf8")).resolves.toBe("")
    expect(syncStatuses(fixture.calls)).toEqual(["synchronized", "unchanged"])
    expect(fixture.calls.map(([name]) => name)).toEqual([
      "nkdk.validate_project",
      "nkdk.sync_to_infobase",
      "nkdk.sync_to_infobase",
    ])
    expect(fixture.comparisons).toHaveLength(0)
    expect(fixture.progress).toEqual(["[3/12] objects:probe — 12.34s"])
  })

  it("wraps a validation error with operation paths and the attempt log directory", async () => {
    const fixture = await createFixture({ validationErrors: 1 })
    const steps = createPartialSyncSteps(
      { workspace: fixture.workspace, session: fixture.session, mode: "standalone-server" },
      fixture.dependencies
    )

    await expect(steps.executeBlock(testBlock([testOperation()]), { index: 1, total: 12 }))
      .rejects.toThrow(/objects:probe.*Справочник\/Проверочный\/Свойства.yaml.*logs.*attempt-1/isu)

    expect(fixture.calls.some(([name]) => name === "nkdk.sync_to_infobase")).toBe(false)
    expect(fixture.comparisons).toEqual([])
  })

  it("fails final verification when the imported cf tree differs", async () => {
    const fixture = await createFixture({ comparisonEqual: false })
    const steps = createPartialSyncSteps(
      { workspace: fixture.workspace, session: fixture.session, mode: "standalone-server" },
      fixture.dependencies
    )

    await steps.executeBlock(testBlock([testOperation()]), { index: 1, total: 12 })
    await expect(steps.verifyFinalState()).rejects.toThrow(/сравнение/iu)

    expect(fixture.comparisons).toHaveLength(1)
  })
})

async function createFixture(options: {
  validationErrors?: number
  comparisonEqual?: boolean
  nowValues?: number[]
} = {}) {
  const root = await mkdtemp(join(tmpdir(), "nkdk-partial-sync-steps-"))
  const workspace = await openScenarioWorkspace(root, { planHash, reset: false })
  const calls: Array<[string, Record<string, unknown>]> = []
  const comparisons: Array<{ expectedDir: string; actualDir: string }> = []
  const progress: string[] = []
  const nowValues = [...(options.nowValues ?? [0, 1_000])]
  let syncIndex = 0
  let openSessionCalls = 0
  const session = {
    async call<T>(toolName: string, input: unknown): Promise<T> {
      calls.push([toolName, { ...(input as Record<string, unknown>) }])
      if (toolName === "nkdk.validate_project") {
        return {
          ok: true,
          diagnostics: options.validationErrors === 1
            ? [{ severity: "error", message: "invalid" }]
            : [],
          summary: { errors: options.validationErrors ?? 0, warnings: 0 },
        } as T
      }
      if (toolName === "nkdk.sync_to_infobase") {
        const status = syncIndex % 2 === 0 ? "synchronized" : "unchanged"
        syncIndex += 1
        Object.assign(calls.at(-1)?.[1] ?? {}, { observedStatus: status })
        return { ok: true, status } as T
      }
      return { ok: true, failed: [] } as T
    },
    async close() {},
  }
  const dependencies: PartialSyncStepDependencies = {
    cfXmlDir: "/fixtures/xml/cf",
    extensionXmlDir: "/fixtures/xml/cfe/all-extension",
    extensionName: "Расширение_All",
    operationId: () => "attempt-1",
    now: () => nowValues.shift() ?? 1_000,
    writeProgress(message) { progress.push(message) },
    applyScenarioBlock,
    async prepareInfobaseFixture() {},
    async compareFileTrees(params) {
      comparisons.push({ expectedDir: params.expectedDir, actualDir: params.actualDir })
      return {
        equal: options.comparisonEqual ?? true,
        added: [],
        removed: [],
        changed: options.comparisonEqual === false ? ["different.yaml"] : [],
      }
    },
  }
  return {
    workspace,
    dependencies,
    session,
    calls,
    comparisons,
    progress,
    openSessionCalls: () => openSessionCalls,
  }
}

function testOperation(key = "object:test"): ScenarioOperation {
  const suffix = key === "object:test" ? "" : key.split(":").at(-1)
  const objectName = `Проверочный${suffix}`
  return {
    key,
    kind: "create-object",
    changes: [{
      path: `Справочник/${objectName}/Свойства.yaml`,
      before: null,
      after: "",
    }],
  }
}

function testBlock(
  operations: readonly ScenarioOperation[],
  key: ScenarioBlock["key"] = "objects:probe",
): ScenarioBlock {
  return { key, layerKey: "objects", componentPath: "cf", operations }
}

function syncStatuses(calls: Array<[string, Record<string, unknown>]>): unknown[] {
  return calls
    .filter(([name]) => name === "nkdk.sync_to_infobase")
    .map(([, input]) => input.observedStatus)
}
