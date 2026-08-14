import { randomUUID } from "node:crypto"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { compareFileTrees, type FileTreeComparison } from "../support/file-tree"
import type { ScenarioOperation } from "./matrix/types"
import { openScenarioMcpSession, type ScenarioMcpSession } from "./mcp-session"
import { applyScenarioOperation } from "./operation"
import { prepareInfobaseFixture } from "./platform-fixture"
import type { ScenarioWorkspace } from "./workspace"

export type ScenarioProgress = {
  readonly index: number
  readonly total: number
}

export type PartialSyncSteps = {
  prepareBaseline(): Promise<void>
  executeOperation(operation: ScenarioOperation, progress: ScenarioProgress): Promise<void>
}

export type PartialSyncStepDependencies = {
  readonly cfXmlDir: string
  readonly extensionXmlDir: string
  readonly extensionName: string
  operationId(): string
  now(): number
  writeProgress(message: string): void
  applyScenarioOperation: typeof applyScenarioOperation
  prepareInfobaseFixture: typeof prepareInfobaseFixture
  openMcpSession(params: { attemptLogDir: string }): Promise<ScenarioMcpSession>
  compareFileTrees(params: Parameters<typeof compareFileTrees>[0]): Promise<FileTreeComparison>
}

type CreatePartialSyncStepsParams = {
  readonly workspace: ScenarioWorkspace
}

export function createPartialSyncSteps(
  params: CreatePartialSyncStepsParams,
  dependencies: PartialSyncStepDependencies = defaultDependencies,
): PartialSyncSteps {
  const { workspace } = params
  return {
    async prepareBaseline() {
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
        extensionName: dependencies.extensionName,
      })
      await writeProjectSettings(workspace.projectDir, workspace.baseDir)
      const session = await dependencies.openMcpSession({ attemptLogDir })
      const verificationProjectDir = join(workspace.verificationDir, "current")
      let projectOpen = false
      let verificationOpen = false
      try {
        await importCf(session, workspace.projectDir)
        projectOpen = true
        await prepareVerificationProject(verificationProjectDir, workspace.baseDir)
        await importCf(session, verificationProjectDir)
        verificationOpen = true
        await expectEqualCf(dependencies, {
          expectedDir: join(workspace.projectDir, "cf"),
          actualDir: join(verificationProjectDir, "cf"),
          reportDir: join(attemptLogDir, "compare-baseline-cf"),
        })
      } finally {
        if (verificationOpen) await closePlatformConnection(session, verificationProjectDir)
        if (projectOpen) await closePlatformConnection(session, workspace.projectDir)
        await session.close()
      }
    },

    async executeOperation(operation, progress) {
      const startedAt = dependencies.now()
      const safeKey = operation.key.replaceAll(/[^a-zA-Z0-9а-яА-ЯёЁ._-]/gu, "-")
      const attemptLogDir = join(
        workspace.logsDir,
        `${dependencies.operationId()}-${safeKey}`,
      )
      const paths = operation.changes.map(({ path }) => path).toSorted()
      let session: ScenarioMcpSession | undefined
      let projectOpen = false
      let verificationOpen = false
      const verificationProjectDir = join(workspace.verificationDir, "current")
      try {
        await dependencies.applyScenarioOperation(workspace.projectDir, operation)
        session = await dependencies.openMcpSession({ attemptLogDir })
        projectOpen = true
        await expectSuccessfulValidation(session, workspace.projectDir)
        await syncAndExpectStable(session, workspace.projectDir)
        await closePlatformConnection(session, workspace.projectDir)
        projectOpen = false
        await prepareVerificationProject(verificationProjectDir, workspace.baseDir)
        await importCf(session, verificationProjectDir)
        verificationOpen = true
        await expectEqualCf(dependencies, {
          expectedDir: join(workspace.projectDir, "cf"),
          actualDir: join(verificationProjectDir, "cf"),
          reportDir: join(attemptLogDir, `compare-${safeKey}-cf`),
        })
        await closePlatformConnection(session, verificationProjectDir)
        verificationOpen = false
      } catch (caught) {
        const detail = caught instanceof Error ? caught.message : String(caught)
        throw new Error(
          `Операция ${operation.key} завершилась ошибкой: ${detail}; пути: ${paths.join(", ")}; журнал: ${attemptLogDir}`,
          { cause: caught },
        )
      } finally {
        if (session !== undefined) {
          if (verificationOpen) await closePlatformConnection(session, verificationProjectDir)
          if (projectOpen) await closePlatformConnection(session, workspace.projectDir)
          await session.close()
        }
      }
      const elapsedSeconds = (dependencies.now() - startedAt) / 1_000
      dependencies.writeProgress(
        `[${progress.index}/${progress.total}] ${operation.key} — ${elapsedSeconds.toFixed(2)}s`,
      )
    },
  }
}

async function importCf(session: ScenarioMcpSession, projectDir: string): Promise<void> {
  const payload = await session.call<ImportPayload>("nkdk.import_from_infobase", {
    projectDir,
    componentPath: "cf",
    allowWrite: true,
  })
  if (payload.ok !== true || (payload.failed?.length ?? 0) > 0) {
    throw new Error("Импорт cf завершился с ошибками")
  }
}

async function expectSuccessfulValidation(
  session: ScenarioMcpSession,
  projectDir: string,
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

async function expectEqualCf(
  dependencies: PartialSyncStepDependencies,
  params: Parameters<typeof compareFileTrees>[0],
): Promise<void> {
  const comparison = await dependencies.compareFileTrees(params)
  if (!comparison.equal) {
    throw new Error(`Сравнение деревьев завершилось с различиями: ${comparison.reportDir ?? params.reportDir}`)
  }
}

async function closePlatformConnection(session: ScenarioMcpSession, projectDir: string): Promise<void> {
  await session.call("nkdk.close_platform_connection", { projectDir })
}

async function prepareVerificationProject(projectDir: string, baseDir: string): Promise<void> {
  await resetDirectory(projectDir)
  await writeProjectSettings(projectDir, baseDir)
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
  extensionName: "Расширение_All",
  operationId: randomUUID,
  now: Date.now,
  writeProgress(message) { process.stdout.write(`${message}\n`) },
  applyScenarioOperation,
  prepareInfobaseFixture,
  openMcpSession: openScenarioMcpSession,
  compareFileTrees,
}
