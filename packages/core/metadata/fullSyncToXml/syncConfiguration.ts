import fs from "node:fs"
import { availableParallelism } from "node:os"
import { resolve } from "node:path"
import { NKDK_CORE_VERSION } from "../../version"
import {
  configurationIndexPath,
  DEFAULT_CONFIGURATION_INDEX_BASE_ID,
  writeConfigurationIndexAtomically,
} from "../configurationIndex/fileIO"
import { encodeConfigurationIndexFragments, mergeConfigurationIndexFragments } from "../configurationIndex/fragment"
import { createConfigurationIndexReader, readConfigurationIndexSnapshot } from "../configurationIndex/sharedSnapshot"
import type {
  ConfigurationIndexData,
  ConfigurationProjectFile,
} from "../configurationIndex/types"
import type { ConfigurationContext } from "../context/types"
import { buildFullXmlSyncPlan } from "./discovery"
import { createFullXmlSyncSharedMetadata, type FullXmlSyncSharedMetadata } from "./sharedMetadata"
import { transferFullXmlSyncExternalFiles } from "./transferExternalFiles"
import type { FullXmlSyncDiagnostic, FullXmlSyncPlan } from "./types"
import { createFullXmlSyncWorkerPool, type FullXmlSyncWorkerPool } from "./workerPool"
import { writeFullXmlSyncConfigDumpInfo } from "./writeConfigDumpInfo"

export interface SyncConfigurationToXmlParams {
  readonly context: ConfigurationContext
  readonly yamlDir: string
  readonly xmlDir: string
  readonly baseId?: string
  readonly concurrency?: number
  readonly transferConcurrency?: number
}

export interface PlanSyncConfigurationToXmlParams {
  readonly yamlDir: string
  readonly xmlDir: string
  readonly baseId?: string
}

export interface FullXmlSyncResult {
  readonly succeeded: number
  readonly failed: readonly FullXmlSyncDiagnostic[]
  readonly warnings: readonly FullXmlSyncDiagnostic[]
  readonly configurationIndexPath?: string
}

export type FullXmlSyncPlanResult =
  | {
      readonly ok: true
      readonly mode: "plan"
      readonly assignments: number
      readonly externalFiles: number
      readonly configurationIndexPath: string
    }
  | {
      readonly ok: false
      readonly failed: readonly FullXmlSyncDiagnostic[]
    }

export interface FullXmlSyncCoordinatorDependencies {
  readonly exists: (path: string) => Promise<boolean>
  readonly isDirectoryEmpty: (path: string) => Promise<boolean>
  readonly mkdir: (path: string) => Promise<void>
  readonly discover: (params: { projectDir: string }) => Promise<FullXmlSyncPlan>
  readonly readIndexSnapshot: (params: { projectDir: string; baseId: string }) => Promise<Awaited<ReturnType<typeof readConfigurationIndexSnapshot>>>
  readonly createWorkerPool: (params: { concurrency: number }) => FullXmlSyncWorkerPool
  readonly createSharedMetadata: typeof createFullXmlSyncSharedMetadata
  readonly transferExternalFiles: typeof transferFullXmlSyncExternalFiles
  readonly writeConfigDumpInfo: typeof writeFullXmlSyncConfigDumpInfo
  readonly writeIndex: (params: { projectDir: string; data: ConfigurationIndexData }) => Promise<void>
}

const defaultDependencies: FullXmlSyncCoordinatorDependencies = {
  async exists(path) {
    return fs.promises
      .access(path)
      .then(() => true)
      .catch(() => false)
  },
  async isDirectoryEmpty(path) {
    return (await fs.promises.readdir(path)).length === 0
  },
  async mkdir(path) {
    await fs.promises.mkdir(path, { recursive: true })
  },
  discover: ({ projectDir }) => buildFullXmlSyncPlan({ projectDir }),
  readIndexSnapshot: readConfigurationIndexSnapshot,
  createWorkerPool: ({ concurrency }) => createFullXmlSyncWorkerPool({ concurrency }),
  createSharedMetadata: createFullXmlSyncSharedMetadata,
  transferExternalFiles: transferFullXmlSyncExternalFiles,
  writeConfigDumpInfo: writeFullXmlSyncConfigDumpInfo,
  writeIndex: writeConfigurationIndexAtomically,
}

export async function syncConfigurationToXml(
  params: SyncConfigurationToXmlParams,
  deps: FullXmlSyncCoordinatorDependencies = defaultDependencies
): Promise<FullXmlSyncResult> {
  const yamlDir = resolve(params.yamlDir)
  const xmlDir = resolve(params.xmlDir)
  const baseId = params.baseId ?? DEFAULT_CONFIGURATION_INDEX_BASE_ID
  let pool: FullXmlSyncWorkerPool | undefined
  let warnings: FullXmlSyncDiagnostic[] = []

  try {
    const preflight = await preflightFullXmlSync({ yamlDir, xmlDir, deps })
    if ("failed" in preflight) return failedResult(preflight.failed)
    if (!preflight.targetExists) {
      await deps.mkdir(xmlDir)
    }

    const indexSnapshot = await deps.readIndexSnapshot({ projectDir: yamlDir, baseId })
    const indexReader = createConfigurationIndexReader(indexSnapshot)
    const previousBinding = indexReader.binding()
    const plan = await deps.discover({ projectDir: yamlDir })

    pool = deps.createWorkerPool({ concurrency: normalizeConcurrency(params.concurrency) })
    await pool.initialize({ projectDir: yamlDir, outputDir: xmlDir, context: params.context })
    const first = await pool.runFirstPass(plan.assignments)
    if (hasErrors(first.diagnostics)) return failedResult(first.diagnostics)

    const sharedMetadata: FullXmlSyncSharedMetadata = deps.createSharedMetadata({
      assignments: plan.assignments,
      owners: first.ownerFacts,
    })
    const second = await pool.runSecondPass({
      sharedMetadata,
      index: indexSnapshot,
      generationSeed: new Uint8Array(),
    })
    warnings = second.warnings
    if (hasErrors(second.diagnostics)) return failedResult(second.diagnostics, warnings)

    const external = await deps.transferExternalFiles({
      outputDir: xmlDir,
      files: plan.externalFiles,
      ...(params.transferConcurrency === undefined ? {} : { concurrency: params.transferConcurrency }),
    })
    const configDumpInfo = await deps.writeConfigDumpInfo({
      context: params.context,
      outputDir: xmlDir,
      assignments: plan.assignments,
      index: indexReader,
    })
    const configDumpFragmentData = mergeConfigurationIndexFragments([
      encodeConfigurationIndexFragments([configDumpInfo.fragment]),
    ])
    const indexData = buildFullXmlSyncConfigurationIndex({
      previous: previousBinding,
      projectFiles: [...first.projectFiles, ...external.projectFiles],
      fragmentData: mergeFragmentData(second.fragmentData, configDumpFragmentData),
    })
    await deps.writeIndex({ projectDir: yamlDir, data: indexData })

    return {
      succeeded: plan.assignments.length + plan.externalFiles.length + 1,
      failed: [],
      warnings,
      configurationIndexPath: configurationIndexPath(yamlDir, baseId),
    }
  } catch (caught) {
    return failedResult([operationDiagnostic("full_xml_sync_operation_failed", errorMessage(caught))], warnings)
  } finally {
    await pool?.close()
  }
}

export async function planSyncConfigurationToXml(
  params: PlanSyncConfigurationToXmlParams,
  deps: Pick<FullXmlSyncCoordinatorDependencies, "exists" | "isDirectoryEmpty" | "discover" | "readIndexSnapshot"> = defaultDependencies
): Promise<FullXmlSyncPlanResult> {
  const yamlDir = resolve(params.yamlDir)
  const xmlDir = resolve(params.xmlDir)
  const baseId = params.baseId ?? DEFAULT_CONFIGURATION_INDEX_BASE_ID

  try {
    const preflight = await preflightFullXmlSync({ yamlDir, xmlDir, deps })
    if ("failed" in preflight) return { ok: false, failed: preflight.failed }
    await deps.readIndexSnapshot({ projectDir: yamlDir, baseId })
    const plan = await deps.discover({ projectDir: yamlDir })
    return {
      ok: true,
      mode: "plan",
      assignments: plan.assignments.length,
      externalFiles: plan.externalFiles.length,
      configurationIndexPath: configurationIndexPath(yamlDir, baseId),
    }
  } catch (caught) {
    return { ok: false, failed: [operationDiagnostic("full_xml_sync_operation_failed", errorMessage(caught))] }
  }
}

async function preflightFullXmlSync(params: {
  readonly yamlDir: string
  readonly xmlDir: string
  readonly deps: Pick<FullXmlSyncCoordinatorDependencies, "exists" | "isDirectoryEmpty">
}): Promise<{ readonly targetExists: boolean } | { readonly failed: readonly FullXmlSyncDiagnostic[] }> {
  if (!(await params.deps.exists(params.yamlDir))) {
    return { failed: [operationDiagnostic("full_xml_sync_project_not_found", `Проект не найден: ${params.yamlDir}`)] }
  }
  if (await params.deps.exists(params.xmlDir)) {
    if (!(await params.deps.isDirectoryEmpty(params.xmlDir))) {
      return {
        failed: [
          operationDiagnostic(
            "full_xml_sync_target_not_empty",
            `XML-каталог должен отсутствовать или быть пустым: ${params.xmlDir}`
          ),
        ],
      }
    }
    return { targetExists: true }
  }
  return { targetExists: false }
}

function buildFullXmlSyncConfigurationIndex(params: {
  previous: ConfigurationIndexData["binding"]
  projectFiles: readonly ConfigurationProjectFile[]
  fragmentData: Pick<ConfigurationIndexData, "identities" | "xmlNodes" | "xmlValues">
}): ConfigurationIndexData {
  return {
    binding: {
      ...params.previous,
      producerVersion: NKDK_CORE_VERSION,
      indexGeneration: params.previous.indexGeneration + 1n,
    },
    projectFiles: [...params.projectFiles].sort((left, right) =>
      Buffer.compare(Buffer.from(left.projectPath), Buffer.from(right.projectPath))
    ),
    identities: params.fragmentData.identities,
    xmlNodes: params.fragmentData.xmlNodes,
    xmlValues: params.fragmentData.xmlValues,
  }
}

function mergeFragmentData(
  left: Pick<ConfigurationIndexData, "identities" | "xmlNodes" | "xmlValues">,
  right: Pick<ConfigurationIndexData, "identities" | "xmlNodes" | "xmlValues">
): Pick<ConfigurationIndexData, "identities" | "xmlNodes" | "xmlValues"> {
  return mergeConfigurationIndexFragments([
    encodeConfigurationIndexFragments([{ targetProjectPath: "worker", ...left }]),
    encodeConfigurationIndexFragments([{ targetProjectPath: "ConfigDumpInfo", ...right }]),
  ])
}

function failedResult(
  failed: readonly FullXmlSyncDiagnostic[],
  warnings: readonly FullXmlSyncDiagnostic[] = []
): FullXmlSyncResult {
  return { succeeded: 0, failed, warnings }
}

function hasErrors(diagnostics: readonly FullXmlSyncDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error")
}

function operationDiagnostic(code: string, message: string): FullXmlSyncDiagnostic {
  return { severity: "error", code, message }
}

function normalizeConcurrency(value: number | undefined): number {
  if (value !== undefined) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new Error("Степень параллелизма full XML sync должна быть положительным целым числом")
    }
    return value
  }
  return Math.max(1, Math.min(4, availableParallelism() - 1))
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
