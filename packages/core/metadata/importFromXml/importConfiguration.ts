import { randomUUID } from "node:crypto"
import fs from "node:fs"
import { availableParallelism } from "node:os"
import {
  configurationIndexPath,
  hashConfigurationProjectFiles,
  readConfigurationIndex,
  writeConfigurationIndexAtomically,
  type ConfigurationIndexData,
  type ConfigurationProjectFile,
} from "../configurationIndex"
import type { ConfigurationContextFromXML } from "../context/types"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import type { SharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import { NKDK_CORE_VERSION } from "../../version"
import { discoverXmlImport } from "./discovery"
import { createImportSharedMetadata } from "./metadataSnapshot"
import { describeRegisteredXmlImportRoutes } from "./routes"
import { createImportTempRoot } from "./tempDirectory"
import { mergeImportResultFiles, transferImportResult } from "./transfer"
import type { ImportAssignment, ImportDiagnostic, ImportResultFile } from "./types"
import {
  createXmlImportWorkerPool,
  type XmlImportWorkerPool,
  type XmlImportWorkerPoolHandle,
} from "./workerPool"

export interface ConfigurationImportResult {
  succeeded: number
  failed: ImportDiagnostic[]
  warnings: ImportDiagnostic[]
  configurationIndexPath?: string
  preservedTempRoot?: string
}

export interface ImportConfigurationFromXmlParams {
  context: ConfigurationContextFromXML
  inputDir: string
  outputDir: string
  concurrency?: number
  transferConcurrency?: number
  hashConcurrency?: number
  operationId?: string
  xmlImportWorkerPoolHandle?: XmlImportWorkerPoolHandle
}

export interface ImportCoordinatorDependencies {
  createWorkerPool(params: { concurrency: number }): XmlImportWorkerPool
  discover(params: { xmlDir: string }): Promise<{ assignments: ImportAssignment[] }>
  createSharedMetadata(facts: readonly ValidationOwnerFacts[]): SharedValidationSnapshot
  mergeFiles(files: readonly ImportResultFile[]): ImportResultFile[]
  transfer(params: {
    projectDir: string
    files: readonly ImportResultFile[]
    concurrency?: number
  }): Promise<void>
  hashProject(projectDir: string, options: { concurrency?: number }): Promise<ConfigurationProjectFile[]>
  readIndex(params: { projectDir: string; baseId: string }): Promise<ConfigurationIndexData | undefined>
  writeIndex(params: { projectDir: string; data: ConfigurationIndexData }): Promise<void>
  removeTemp(tempRoot: string): Promise<void>
}

const defaultImportDependencies: ImportCoordinatorDependencies = {
  createWorkerPool: createXmlImportWorkerPool,
  async discover({ xmlDir }) {
    return discoverXmlImport({ xmlDir, routes: describeRegisteredXmlImportRoutes() })
  },
  createSharedMetadata: createImportSharedMetadata,
  mergeFiles: mergeImportResultFiles,
  transfer: transferImportResult,
  hashProject: hashConfigurationProjectFiles,
  readIndex: readConfigurationIndex,
  writeIndex: writeConfigurationIndexAtomically,
  async removeTemp(tempRoot) {
    await fs.promises.rm(tempRoot, { recursive: true, force: true })
  },
}

export async function importConfigurationFromXml(
  params: ImportConfigurationFromXmlParams,
  deps: ImportCoordinatorDependencies = defaultImportDependencies
): Promise<ConfigurationImportResult> {
  const operationId = params.operationId ?? randomUUID()
  const tempRoot = createImportTempRoot(params.outputDir, operationId)
  const pool =
    params.xmlImportWorkerPoolHandle?.createOperationPool() ??
    deps.createWorkerPool({ concurrency: normalizeConcurrency(params.concurrency) })
  let warnings: ImportDiagnostic[] = []

  try {
    await fs.promises.mkdir(tempRoot, { recursive: true })
    const discovered = await deps.discover({ xmlDir: params.inputDir })
    await pool.initialize({ operationId, context: params.context, tempRoot })
    const first = await pool.runFirstPass(discovered.assignments)
    if (hasErrors(first.diagnostics)) return failedResult(first.diagnostics, [], tempRoot)

    const sharedMetadata = deps.createSharedMetadata(first.ownerFacts)
    const second = await pool.runSecondPass(sharedMetadata)
    warnings = second.warnings
    if (hasErrors(second.diagnostics)) return failedResult(second.diagnostics, warnings, tempRoot)

    const files = deps.mergeFiles(second.files)
    await deps.transfer({
      projectDir: params.outputDir,
      files,
      ...(params.transferConcurrency === undefined ? {} : { concurrency: params.transferConcurrency }),
    })
    const projectFiles = await deps.hashProject(params.outputDir, {
      ...(params.hashConcurrency === undefined ? {} : { concurrency: params.hashConcurrency }),
    })
    const previousIndex = await readablePreviousIndex(deps, params.outputDir)
    const indexData = buildImportedConfigurationIndex({
      producerVersion: NKDK_CORE_VERSION,
      baseId: "default",
      indexGeneration: (previousIndex?.binding.indexGeneration ?? 0n) + 1n,
      projectFiles,
      fragmentData: first.fragmentData,
    })
    await deps.writeIndex({ projectDir: params.outputDir, data: indexData })
    await deps.removeTemp(tempRoot)

    return successResult(discovered.assignments.length, warnings, params.outputDir)
  } catch (caught) {
    return failedResult([operationDiagnostic(caught)], warnings, tempRoot)
  } finally {
    await pool.close()
  }
}

async function readablePreviousIndex(
  deps: ImportCoordinatorDependencies,
  projectDir: string
): Promise<ConfigurationIndexData | undefined> {
  try {
    return await deps.readIndex({ projectDir, baseId: "default" })
  } catch {
    return undefined
  }
}

function buildImportedConfigurationIndex(params: {
  producerVersion: string
  baseId: string
  indexGeneration: bigint
  projectFiles: readonly ConfigurationProjectFile[]
  fragmentData: Pick<ConfigurationIndexData, "identities" | "xmlNodes" | "xmlValues">
}): ConfigurationIndexData {
  return {
    binding: {
      indexGeneration: params.indexGeneration,
      producerVersion: params.producerVersion,
      baseId: params.baseId,
      baseFingerprint: new Uint8Array(),
      configurationVersion: new Uint8Array(),
    },
    projectFiles: params.projectFiles,
    identities: params.fragmentData.identities,
    xmlNodes: params.fragmentData.xmlNodes,
    xmlValues: params.fragmentData.xmlValues,
  }
}

function successResult(
  succeeded: number,
  warnings: ImportDiagnostic[],
  projectDir: string
): ConfigurationImportResult {
  return {
    succeeded,
    failed: [],
    warnings,
    configurationIndexPath: configurationIndexPath(projectDir, "default"),
  }
}

function failedResult(
  failed: ImportDiagnostic[],
  warnings: ImportDiagnostic[],
  preservedTempRoot: string
): ConfigurationImportResult {
  return { succeeded: 0, failed, warnings, preservedTempRoot }
}

function hasErrors(diagnostics: readonly ImportDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error")
}

function operationDiagnostic(caught: unknown): ImportDiagnostic {
  return {
    severity: "error",
    code: "xml_import_operation_failed",
    message: caught instanceof Error ? caught.message : String(caught),
    targetProjectPath: "",
  }
}

function normalizeConcurrency(value: number | undefined): number {
  if (value !== undefined) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new Error("Степень параллелизма XML-import должна быть положительным целым числом")
    }
    return value
  }
  return Math.max(1, Math.min(4, availableParallelism() - 1))
}
