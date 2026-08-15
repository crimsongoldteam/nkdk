import { randomUUID } from "node:crypto"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { compareFileTrees, type FileTreeComparison } from "../support/file-tree"
import type { ScenarioBlock } from "./matrix/types"
import type { ScenarioMcpSession } from "./mcp-session"
import { applyScenarioBlock } from "./operation"
import { prepareInfobaseFixture } from "./platform-fixture"
import type { ScenarioWorkspace } from "./workspace"

export type ScenarioProgress = {
  readonly index: number
  readonly total: number
}

export type PartialSyncSteps = {
  prepareBaseline(): Promise<void>
  executeBlock(block: ScenarioBlock, progress: ScenarioProgress): Promise<BlockStepTiming>
  verifyFinalState(): Promise<void>
}

export type BlockStepTiming = Omit<import("./timing").BlockExecutionTiming, "blockKey" | "checkpointMs">

export type PartialSyncStepDependencies = {
  readonly cfXmlDir: string
  readonly extensionXmlDir: string
  readonly extensionName: string
  operationId(): string
  now(): number
  writeProgress(message: string): void
  applyScenarioBlock: typeof applyScenarioBlock
  prepareInfobaseFixture: typeof prepareInfobaseFixture
  compareFileTrees(params: Parameters<typeof compareFileTrees>[0]): Promise<FileTreeComparison>
}

type CreatePartialSyncStepsParams = {
  readonly workspace: ScenarioWorkspace
  readonly session: ScenarioMcpSession
  readonly mode: "designer-agent" | "standalone-server"
}

export function createPartialSyncSteps(
  params: CreatePartialSyncStepsParams,
  dependencies: PartialSyncStepDependencies = defaultDependencies,
): PartialSyncSteps {
  const { workspace, session, mode } = params
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
      await writeProjectSettings(workspace.projectDir, workspace.baseDir, mode)
      await importCf(session, workspace.projectDir, attemptLogDir)
    },

    async executeBlock(block, progress) {
      const startedAt = dependencies.now()
      const safeKey = block.key.replaceAll(/[^a-zA-Z0-9а-яА-ЯёЁ._-]/gu, "-")
      const attemptLogDir = join(
        workspace.logsDir,
        `${dependencies.operationId()}-${safeKey}`,
      )
      const paths = [...new Set(block.operations.flatMap(({ changes }) => changes.map(({ path }) => path)))].toSorted()
      try {
        await dependencies.applyScenarioBlock(workspace.projectDir, block)
        const appliedAt = dependencies.now()
        await expectSuccessfulValidation(session, workspace.projectDir, attemptLogDir)
        const validatedAt = dependencies.now()
        await syncAndExpectStatus(
          session, workspace.projectDir, block.componentPath, attemptLogDir, "synchronized",
        )
        const synchronizedAt = dependencies.now()
        await syncAndExpectStatus(
          session, workspace.projectDir, block.componentPath, attemptLogDir, "unchanged",
        )
        const unchangedAt = dependencies.now()
        const elapsedSeconds = (unchangedAt - startedAt) / 1_000
        dependencies.writeProgress(
          `[${progress.index}/${progress.total}] ${block.key} — ${elapsedSeconds.toFixed(2)}s`,
        )
        return {
          applyMs: appliedAt - startedAt,
          validationMs: validatedAt - appliedAt,
          synchronizeMs: synchronizedAt - validatedAt,
          unchangedMs: unchangedAt - synchronizedAt,
        }
      } catch (caught) {
        const detail = caught instanceof Error ? caught.message : String(caught)
        throw new Error(
          `Блок ${block.key} завершился ошибкой: ${detail}; пути: ${paths.join(", ")}; журнал: ${attemptLogDir}`,
          { cause: caught },
        )
      }
    },

    async verifyFinalState() {
      const attemptLogDir = join(
        workspace.logsDir,
        `${dependencies.operationId()}-verify-final`,
      )
      const verificationProjectDir = join(workspace.verificationDir, "current")
      await closePlatformConnection(session, workspace.projectDir, attemptLogDir)
      await prepareVerificationProject(verificationProjectDir, workspace.baseDir, mode)
      try {
        await importCf(session, verificationProjectDir, attemptLogDir)
        await expectEqualCf(dependencies, {
          expectedDir: join(workspace.projectDir, "cf"),
          actualDir: join(verificationProjectDir, "cf"),
          reportDir: join(attemptLogDir, "compare-final-cf"),
          xmlComparison: "semantic",
          yamlComparison: "ignore-final-line-ending",
          textComparison: "normalize",
        })
      } finally {
        await closePlatformConnection(session, verificationProjectDir, attemptLogDir)
      }
    },
  }
}

async function importCf(
  session: ScenarioMcpSession,
  projectDir: string,
  attemptLogDir: string,
): Promise<void> {
  const payload = await session.call<ImportPayload>("nkdk.import_from_infobase", {
    projectDir,
    componentPath: "cf",
    allowWrite: true,
  }, { attemptLogDir })
  if (payload.ok !== true || (payload.failed?.length ?? 0) > 0) {
    throw new Error("Импорт cf завершился с ошибками")
  }
}

async function expectSuccessfulValidation(
  session: ScenarioMcpSession,
  projectDir: string,
  attemptLogDir: string,
): Promise<void> {
  const payload = await session.call<ValidationPayload>(
    "nkdk.validate_project",
    { projectDir },
    { attemptLogDir },
  )
  const errors = payload.diagnostics?.filter(({ severity }) => severity === "error") ?? []
  if (payload.ok !== true || errors.length > 0 || (payload.summary?.errors ?? 0) > 0) {
    throw new Error(`Project validation завершилась с ${Math.max(errors.length, payload.summary?.errors ?? 0)} ошибками`)
  }
}

async function syncAndExpectStatus(
  session: ScenarioMcpSession,
  projectDir: string,
  componentPath: ScenarioBlock["componentPath"],
  attemptLogDir: string,
  expectedStatus: "synchronized" | "unchanged",
): Promise<void> {
  const payload = await session.call<SyncPayload>(
    "nkdk.sync_to_infobase",
    { projectDir, componentPath, allowWrite: true },
    { attemptLogDir },
  )
  if (payload.ok !== true || payload.status !== expectedStatus) {
    throw new Error(`Частичная синхронизация не вернула ${expectedStatus}`)
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

async function closePlatformConnection(
  session: ScenarioMcpSession,
  projectDir: string,
  attemptLogDir: string,
): Promise<void> {
  await session.call(
    "nkdk.close_platform_connection",
    { projectDir },
    { attemptLogDir },
  )
}

async function prepareVerificationProject(
  projectDir: string,
  baseDir: string,
  mode: "designer-agent" | "standalone-server",
): Promise<void> {
  await resetDirectory(projectDir)
  await writeProjectSettings(projectDir, baseDir, mode)
}

async function writeProjectSettings(
  projectDir: string,
  baseDir: string,
  mode: "designer-agent" | "standalone-server",
): Promise<void> {
  const settingsDir = join(projectDir, ".nkdk")
  await mkdir(settingsDir, { recursive: true })
  await writeFile(join(settingsDir, "project.yaml"), [
    "infobase:",
    `  connectionString: 'File="${baseDir.replaceAll("'", "''")}";'`,
    "  operations:",
    "    import:",
    `      mode: ${mode}`,
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
  applyScenarioBlock,
  prepareInfobaseFixture,
  compareFileTrees,
}
