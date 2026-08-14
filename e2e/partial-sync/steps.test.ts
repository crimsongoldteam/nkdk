import { mkdtemp, readFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { describe, expect, it } from "vitest"
import { openScenarioWorkspace } from "./workspace"
import {
  createPartialSyncSteps,
  type PartialSyncStepDependencies,
} from "./steps"

describe("partial sync steps", () => {
  it("prepares and imports both baseline components through public MCP", async () => {
    const fixture = await createFixture()
    const steps = createPartialSyncSteps({ workspace: fixture.workspace }, fixture.dependencies)

    await steps.baseline()

    expect(fixture.calls).toEqual([
      ["nkdk.list_infobase_extensions", { projectDir: fixture.workspace.projectDir }],
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
      ["nkdk.close_platform_connection", { projectDir: fixture.workspace.projectDir }],
    ])
    const settings = await readFile(join(fixture.workspace.projectDir, ".nkdk/project.yaml"), "utf8")
    expect(settings).toContain(`connectionString: 'File="${fixture.workspace.baseDir}";'`)
    expect(settings).toContain("mode: designer-agent")
    expect(fixture.comparisons.map(({ expectedDir, actualDir }) => [expectedDir, actualDir]))
      .toEqual([
        [fixture.paths.cfNkdkDir, join(fixture.workspace.projectDir, "cf")],
        [fixture.paths.extensionNkdkDir, join(fixture.workspace.projectDir, "cfe/Расширение_All")],
      ])
  })

  it("adds a catalog, then its attribute, and verifies stable synchronization", async () => {
    const fixture = await createFixture()
    const steps = createPartialSyncSteps({ workspace: fixture.workspace }, fixture.dependencies)

    await steps.catalog()
    const catalogPath = join(
      fixture.workspace.projectDir,
      "cf/Справочник/ПроверкаЧастичнойСинхронизации/Свойства.yaml"
    )
    await expect(readFile(catalogPath, "utf8")).resolves.toBe(
      "Синоним: Проверка частичной синхронизации\n"
    )
    expect(syncStatuses(fixture.calls)).toEqual(["synchronized", "unchanged"])
    expect(fixture.calls.map(([name]) => name)).toEqual([
      "nkdk.validate_project",
      "nkdk.sync_to_infobase",
      "nkdk.sync_to_infobase",
      "nkdk.import_from_infobase",
      "nkdk.import_from_infobase",
      "nkdk.close_platform_connection",
      "nkdk.close_platform_connection",
    ])
    expect(fixture.comparisons).toHaveLength(2)

    fixture.calls.length = 0
    fixture.comparisons.length = 0
    fixture.resetSync()
    await steps.attribute()

    await expect(readFile(catalogPath, "utf8")).resolves.toBe([
      "Синоним: Проверка частичной синхронизации",
      "Реквизиты:",
      "  ТестоваяСтрока:",
      "    Тип: Строка(20)",
      "",
    ].join("\n"))
    expect(syncStatuses(fixture.calls)).toEqual(["synchronized", "unchanged"])
    expect(fixture.comparisons).toHaveLength(2)
  })

  it("stops before synchronization when validation has errors", async () => {
    const fixture = await createFixture({ validationErrors: 1 })
    const steps = createPartialSyncSteps({ workspace: fixture.workspace }, fixture.dependencies)

    await expect(steps.catalog()).rejects.toThrow(/validation/u)

    expect(fixture.calls.some(([name]) => name === "nkdk.sync_to_infobase")).toBe(false)
    expect(fixture.comparisons).toEqual([])
  })

  it("fails the stage when a verification tree differs", async () => {
    const fixture = await createFixture({ comparisonEqual: false })
    const steps = createPartialSyncSteps({ workspace: fixture.workspace }, fixture.dependencies)

    await expect(steps.catalog()).rejects.toThrow(/сравнение/iu)

    expect(fixture.comparisons).toHaveLength(1)
  })
})

async function createFixture(options: {
  validationErrors?: number
  comparisonEqual?: boolean
} = {}) {
  const root = await mkdtemp(join(tmpdir(), "nkdk-partial-sync-steps-"))
  const workspace = await openScenarioWorkspace(root)
  const calls: Array<[string, Record<string, unknown>]> = []
  const comparisons: Array<{ expectedDir: string; actualDir: string }> = []
  let syncIndex = 0
  const paths = {
    cfXmlDir: "/fixtures/xml/cf",
    extensionXmlDir: "/fixtures/xml/cfe/all-extension",
    cfNkdkDir: "/fixtures/nkdk/cf",
    extensionNkdkDir: "/fixtures/nkdk/cfe/Расширение_All",
  }
  const dependencies: PartialSyncStepDependencies = {
    ...paths,
    operationId: () => "attempt-1",
    async prepareInfobaseFixture() {},
    async openMcpSession() {
      return {
        async call<T>(toolName: string, input: unknown): Promise<T> {
          calls.push([toolName, { ...(input as Record<string, unknown>) }])
          if (toolName === "nkdk.list_infobase_extensions") {
            return { ok: true, extensions: [{ name: "Расширение_All" }] } as T
          }
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
            const status = syncIndex === 0 ? "synchronized" : "unchanged"
            syncIndex += 1
            calls[calls.length - 1]?.[1] && Object.assign(calls[calls.length - 1]![1], { observedStatus: status })
            return { ok: true, status } as T
          }
          return { ok: true, failed: [] } as T
        },
        async close() {},
      }
    },
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
    calls,
    comparisons,
    paths,
    resetSync() { syncIndex = 0 },
  }
}

function syncStatuses(calls: Array<[string, Record<string, unknown>]>): unknown[] {
  return calls
    .filter(([name]) => name === "nkdk.sync_to_infobase")
    .map(([, input]) => input["observedStatus"])
}
