import { randomUUID } from "node:crypto"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { compareFileTrees, type FileTreeComparison } from "../support/file-tree"
import { openScenarioMcpSession, type ScenarioMcpSession } from "./mcp-session"
import { prepareInfobaseFixture } from "./platform-fixture"
import type { ScenarioStages } from "./scenario"
import type { ScenarioWorkspace } from "./workspace"

const extensionName = "Расширение_All"
const componentPaths = ["cf", `cfe/${extensionName}`] as const

export type PartialSyncStepDependencies = {
  readonly cfXmlDir: string
  readonly extensionXmlDir: string
  readonly cfNkdkDir: string
  readonly extensionNkdkDir: string
  operationId(): string
  prepareInfobaseFixture: typeof prepareInfobaseFixture
  openMcpSession(params: { attemptLogDir: string }): Promise<ScenarioMcpSession>
  compareFileTrees(params: Parameters<typeof compareFileTrees>[0]): Promise<FileTreeComparison>
}

type CreatePartialSyncStepsParams = {
  readonly workspace: ScenarioWorkspace
}

export function createPartialSyncSteps(
  params: CreatePartialSyncStepsParams,
  dependencies: PartialSyncStepDependencies = defaultDependencies
): ScenarioStages {
  const { workspace } = params
  return {
    async baseline() {
      await resetDirectory(workspace.baseDir)
      await resetDirectory(workspace.dataDir)
      await resetDirectory(workspace.projectDir)
      const attemptLogDir = join(workspace.logsDir, `${dependencies.operationId()}-baseline`)
      await dependencies.prepareInfobaseFixture({
        baseDir: workspace.baseDir,
        dataDir: workspace.dataDir,
        logsDir: attemptLogDir,
        cfXmlDir: dependencies.cfXmlDir,
        extensionXmlDir: dependencies.extensionXmlDir,
        extensionName,
      })
      await writeProjectSettings(workspace.projectDir, workspace.baseDir)
      const session = await dependencies.openMcpSession({ attemptLogDir })
      const verificationProjectDir = join(workspace.verificationDir, "baseline")
      let verificationStarted = false
      try {
        const listed = await session.call<ExtensionListPayload>(
          "nkdk.list_infobase_extensions",
          { projectDir: workspace.projectDir }
        )
        expectOnlyExtension(listed)
        await importComponents(session, workspace.projectDir)
        verificationStarted = true
        await verifyComponents({
          session,
          workspace,
          stage: "baseline",
          attemptLogDir,
          dependencies,
        })
      } finally {
        if (verificationStarted) await closePlatformConnection(session, verificationProjectDir)
        await closePlatformConnection(session, workspace.projectDir)
        await session.close()
      }
    },
    async catalog() {
      await writeCatalog(workspace.projectDir, false)
      await runChangedStage("catalog", workspace, dependencies)
    },
    async attribute() {
      await writeCatalog(workspace.projectDir, true)
      await runChangedStage("attribute", workspace, dependencies)
    },
  }
}

async function runChangedStage(
  stage: "catalog" | "attribute",
  workspace: ScenarioWorkspace,
  dependencies: PartialSyncStepDependencies
): Promise<void> {
  const attemptLogDir = join(workspace.logsDir, `${dependencies.operationId()}-${stage}`)
  const verificationProjectDir = join(workspace.verificationDir, stage)
  const session = await dependencies.openMcpSession({ attemptLogDir })
  let verificationStarted = false
  try {
    await expectSuccessfulValidation(session, workspace.projectDir)
    await syncAndExpectStable(session, workspace.projectDir)
    verificationStarted = true
    await verifyComponents({
      session,
      workspace,
      stage,
      attemptLogDir,
      dependencies,
    })
  } finally {
    if (verificationStarted) await closePlatformConnection(session, verificationProjectDir)
    await closePlatformConnection(session, workspace.projectDir)
    await session.close()
  }
}

async function importComponents(session: ScenarioMcpSession, projectDir: string): Promise<void> {
  for (const componentPath of componentPaths) {
    const payload = await session.call<ImportPayload>("nkdk.import_from_infobase", {
      projectDir,
      componentPath,
      allowWrite: true,
    })
    if (payload.ok !== true || (payload.failed?.length ?? 0) > 0) {
      throw new Error(`Импорт ${componentPath} завершился с ошибками`)
    }
  }
}

async function expectSuccessfulValidation(
  session: ScenarioMcpSession,
  projectDir: string
): Promise<void> {
  const payload = await session.call<ValidationPayload>("nkdk.validate_project", { projectDir })
  const errors = payload.diagnostics?.filter(({ severity }) => severity === "error") ?? []
  if (payload.ok !== true || errors.length > 0 || (payload.summary?.errors ?? 0) > 0) {
    throw new Error(`Project validation завершилась с ${Math.max(errors.length, payload.summary?.errors ?? 0)} ошибками`)
  }
}

async function syncAndExpectStable(session: ScenarioMcpSession, projectDir: string): Promise<void> {
  const input = { projectDir, componentPath: "cf", allowWrite: true }
  const synchronized = await session.call<SyncPayload>("nkdk.sync_to_infobase", input)
  if (synchronized.ok !== true || synchronized.status !== "synchronized") {
    throw new Error("Первичная частичная синхронизация не вернула synchronized")
  }
  const unchanged = await session.call<SyncPayload>("nkdk.sync_to_infobase", input)
  if (unchanged.ok !== true || unchanged.status !== "unchanged") {
    throw new Error("Повторная частичная синхронизация не вернула unchanged")
  }
}

async function verifyComponents(params: {
  readonly session: ScenarioMcpSession
  readonly workspace: ScenarioWorkspace
  readonly stage: "baseline" | "catalog" | "attribute"
  readonly attemptLogDir: string
  readonly dependencies: PartialSyncStepDependencies
}): Promise<void> {
  const verificationProjectDir = join(params.workspace.verificationDir, params.stage)
  await resetDirectory(verificationProjectDir)
  await writeProjectSettings(verificationProjectDir, params.workspace.baseDir)
  await importComponents(params.session, verificationProjectDir)
  await expectEqualTrees(params.dependencies, {
    expectedDir: join(params.workspace.projectDir, "cf"),
    actualDir: join(verificationProjectDir, "cf"),
    reportDir: join(params.attemptLogDir, `compare-${params.stage}-cf`),
  })
  await expectEqualTrees(params.dependencies, {
    expectedDir: join(params.workspace.projectDir, "cfe", extensionName),
    actualDir: join(verificationProjectDir, "cfe", extensionName),
    reportDir: join(params.attemptLogDir, `compare-${params.stage}-extension`),
  })
}

async function expectEqualTrees(
  dependencies: PartialSyncStepDependencies,
  params: Parameters<typeof compareFileTrees>[0]
): Promise<void> {
  const comparison = await dependencies.compareFileTrees(params)
  if (!comparison.equal) {
    throw new Error(`Сравнение деревьев завершилось с различиями: ${comparison.reportDir ?? params.reportDir}`)
  }
}

async function closePlatformConnection(session: ScenarioMcpSession, projectDir: string): Promise<void> {
  await session.call("nkdk.close_platform_connection", { projectDir })
}

async function writeCatalog(projectDir: string, withAttribute: boolean): Promise<void> {
  const directory = join(projectDir, "cf", "Справочник", "ПроверкаЧастичнойСинхронизации")
  await mkdir(directory, { recursive: true })
  const source = withAttribute
    ? [
        "Синоним: Проверка частичной синхронизации",
        "Реквизиты:",
        "  ТестоваяСтрока:",
        "    Тип: Строка(20)",
        "",
      ].join("\n")
    : "Синоним: Проверка частичной синхронизации\n"
  await writeFile(join(directory, "Свойства.yaml"), source, "utf8")
}

async function writeProjectSettings(projectDir: string, baseDir: string): Promise<void> {
  const settingsDir = join(projectDir, ".nkdk")
  await mkdir(settingsDir, { recursive: true })
  await writeFile(join(settingsDir, "project.yaml"), [
    "infobase:",
    `  connectionString: 'File="${baseDir.replaceAll("'", "''")}";'`,
    "  operations:",
    "    import:",
    "      mode: standalone-server",
    "",
  ].join("\n"), { encoding: "utf8", mode: 0o600 })
}

async function resetDirectory(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true })
  await mkdir(path, { recursive: true })
}

function expectOnlyExtension(payload: ExtensionListPayload): void {
  if (payload.ok !== true || payload.extensions?.length !== 1 || payload.extensions[0]?.name !== extensionName) {
    throw new Error(`Ожидалось единственное расширение ${extensionName}`)
  }
}

type ExtensionListPayload = {
  readonly ok?: boolean
  readonly extensions?: ReadonlyArray<{ readonly name?: string }>
}

type ImportPayload = {
  readonly ok?: boolean
  readonly failed?: readonly unknown[]
}

type ValidationPayload = {
  readonly ok?: boolean
  readonly diagnostics?: ReadonlyArray<{ readonly severity?: string }>
  readonly summary?: { readonly errors?: number }
}

type SyncPayload = {
  readonly ok?: boolean
  readonly status?: string
}

const fixturesRoot = resolve(import.meta.dirname, "../fixtures")
const defaultDependencies: PartialSyncStepDependencies = {
  cfXmlDir: join(fixturesRoot, "xml", "cf"),
  extensionXmlDir: join(fixturesRoot, "xml", "cfe", "all-extension"),
  cfNkdkDir: join(fixturesRoot, "nkdk", "cf"),
  extensionNkdkDir: join(fixturesRoot, "nkdk", "cfe", extensionName),
  operationId: randomUUID,
  prepareInfobaseFixture,
  openMcpSession: openScenarioMcpSession,
  compareFileTrees,
}
