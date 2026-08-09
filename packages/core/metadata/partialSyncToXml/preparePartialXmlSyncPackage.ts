import { randomUUID } from "node:crypto"
import { join, resolve } from "node:path"
import { componentPath, parseComponentPath } from "../components/address"
import { decodeConfigurationIndex } from "../configurationIndex/decode"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { hashFileBytes } from "../configurationIndex/hash"
import type { MergedConfigurationSnapshotFragments } from "../configurationIndex/types"
import type { ConfigurationContext } from "../context/types"
import type { Diagnostic } from "../diagnostics/types"
import { resolveFullXmlSyncComponentProfile, type FullXmlSyncProfileRuntime } from "../fullSyncToXml/componentProfile"
import { readProfileComponentStates } from "../fullSyncToXml/componentRuntime"
import { buildXmlSyncPlan } from "../fullSyncToXml/selection"
import { createFullXmlSyncCompositionSnapshot } from "../fullSyncToXml/sharedMetadata"
import { buildXmlSyncConfigurationSnapshot } from "../fullSyncToXml/snapshotBuilder"
import type { FullXmlSyncDiagnostic, FullXmlSyncPlan } from "../fullSyncToXml/types"
import {
  createFullXmlSyncWorkerPool,
  normalizeFullXmlSyncConcurrency,
  type FullXmlSyncWorkerPool,
} from "../fullSyncToXml/workerPool"
import {
  confirmComponentState,
  readComponentHashState,
  readComponentIndexes,
  readComponentProjectStructure,
} from "../project/componentState"
import type { ProjectStateReadToken, ProjectStateService } from "../projectState"
import { detectPartialXmlChanges } from "./changeDetector"
import { buildPartialXmlImpactPlan } from "./impactPlanner"
import { evaluatePartialXmlSyncMigrationState } from "./migrationState"
import { resolvePartialXmlPackagePolicy } from "./packagePolicy"
import {
  cleanupPendingPartialXmlSync,
  partialXmlSyncArchiveProjectPath,
  writePendingPartialXmlSync,
  type PendingPartialXmlSyncStateV1,
} from "./pendingStore"
import { createPartialXmlArchiveWriter, type PartialXmlArchiveWriter } from "./archiveWriter"
import { validateBorrowedExtensionForms } from "./borrowedFormValidation"

export interface PreparePartialXmlSyncPackageParams {
  readonly context: ConfigurationContext
  readonly projectDir: string
  readonly componentPath: string
  readonly concurrency?: number
  readonly projectState: ProjectStateService
}

export type PreparePartialXmlSyncPackageResult =
  | { readonly ok: true; readonly status: "unchanged"; readonly diagnostics: readonly Diagnostic[] }
  | {
      readonly ok: true
      readonly status: "prepared"
      readonly packageId: string
      readonly archivePath: string
      readonly archiveHash: string
      readonly entries: readonly string[]
      readonly loadTargets: readonly string[]
      readonly diagnostics: readonly Diagnostic[]
    }
  | { readonly ok: false; readonly diagnostics: readonly Diagnostic[] }

interface ValidatedPreparationParams extends PreparePartialXmlSyncPackageParams {
  readonly projectDir: string
  readonly componentPath: string
  readonly readToken: ProjectStateReadToken
  readonly diagnostics: readonly Diagnostic[]
}

export interface PartialXmlSyncCoordinatorDependencies {
  readonly cleanup: typeof cleanupPendingPartialXmlSync
  readonly refresh: (params: PreparePartialXmlSyncPackageParams) => Promise<{
    readonly diagnostics: readonly Diagnostic[]
    readonly readToken: ProjectStateReadToken
  }>
  readonly prepareValidated: (params: ValidatedPreparationParams) => Promise<PreparePartialXmlSyncPackageResult>
}

const defaultDependencies: PartialXmlSyncCoordinatorDependencies = {
  cleanup: cleanupPendingPartialXmlSync,
  refresh: refreshProject,
  prepareValidated: prepareValidatedPackage,
}

export async function preparePartialXmlSyncPackage(
  params: PreparePartialXmlSyncPackageParams,
  dependencies: PartialXmlSyncCoordinatorDependencies = defaultDependencies,
): Promise<PreparePartialXmlSyncPackageResult> {
  const projectDir = resolve(params.projectDir)
  let diagnostics: readonly Diagnostic[] = []
  try {
    const address = parseComponentPath(params.componentPath)
    const normalizedComponentPath = componentPath(address)
    await dependencies.cleanup(projectDir, normalizedComponentPath)
    const refreshed = await dependencies.refresh({ ...params, projectDir, componentPath: normalizedComponentPath })
    diagnostics = refreshed.diagnostics
    if (hasErrors(diagnostics)) return { ok: false, diagnostics }
    return await dependencies.prepareValidated({
      ...params,
      projectDir,
      componentPath: normalizedComponentPath,
      diagnostics,
      readToken: refreshed.readToken,
    })
  } catch (caught) {
    await dependencies.cleanup(projectDir, params.componentPath).catch(() => undefined)
    return { ok: false, diagnostics: [...diagnostics, operationDiagnostic(projectDir, caught)] }
  }
}

async function refreshProject(params: PreparePartialXmlSyncPackageParams) {
  const refreshed = await params.projectState.refreshAndValidate({
    projectDir: params.projectDir,
    context: params.context,
    ...(params.concurrency === undefined ? {} : { concurrency: params.concurrency }),
  })
  const diagnostics = [...refreshed.diagnostics]
  refreshed.diagnostics.release()
  return { diagnostics, readToken: refreshed.readToken }
}

async function prepareValidatedPackage(
  params: ValidatedPreparationParams,
): Promise<PreparePartialXmlSyncPackageResult> {
  const address = parseComponentPath(params.componentPath)
  const targetProjection = await params.projectState.readComponentProjection({
    projectDir: params.projectDir,
    componentPath: params.componentPath,
  })
  const profile = resolveFullXmlSyncComponentProfile(address)
  const states = await readProfileComponentStates({
    ...params,
    address,
    profile,
    projectStateReadToken: params.readToken,
    projectStateIndexReadToken: await params.projectState.createReadToken(params.projectDir),
    targetProjection,
    deps: {
      readStructure: readComponentProjectStructure,
      readSnapshot: (await import("../configurationIndex")).readConfigurationIndexSnapshot,
      readHashes: readComponentHashState,
      readIndexes: readComponentIndexes,
      confirmState: confirmComponentState,
    },
  })
  const runtime = profile.confirm(states)
  const previous = decodeSharedSnapshot(runtime.target.snapshot)
  const changes = detectPartialXmlChanges({
    current: runtime.target.hashes.projectFiles,
    previous: previous.files,
  })
  const migration = await evaluatePartialXmlSyncMigrationState({
    projectDir: params.projectDir,
    componentPath: params.componentPath,
    componentDir: runtime.target.structure.componentDir,
  })
  const borrowedDiagnostics = await validateBorrowedExtensionForms({ runtime })
  const diagnostics = [...params.diagnostics, ...borrowedDiagnostics]
  if (hasErrors(borrowedDiagnostics)) return { ok: false, diagnostics }
  if (isEmptyChanges(changes) && migration.pending.length === 0) {
    return { ok: true, status: "unchanged", diagnostics }
  }

  const policies = resolvePartialXmlPackagePolicy(runtime.target.structure.topology)
  const references = readCompanionReferences(params, runtime, policies)
  const impact = buildPartialXmlImpactPlan({
    topology: runtime.target.structure.topology,
    currentResources: runtime.target.structure.resources,
    changes,
    policies,
    referencesFor: (sourceProjectPath) => references.bySource.get(sourceProjectPath) ?? [],
    resolveCanonicalTarget: (canonical) => references.targetByCanonical.get(canonical),
  })
  const plan = buildXmlSyncPlan({
    structure: runtime.target.structure,
    hashes: runtime.target.hashes,
    selection: impact.selection,
  })
  return writePreparedPackage({ ...params, runtime, plan, impact, migration, previous, diagnostics })
}

async function writePreparedPackage(params: ValidatedPreparationParams & {
  readonly runtime: FullXmlSyncProfileRuntime
  readonly plan: FullXmlSyncPlan
  readonly impact: ReturnType<typeof buildPartialXmlImpactPlan>
  readonly migration: Awaited<ReturnType<typeof evaluatePartialXmlSyncMigrationState>>
  readonly previous: ReturnType<typeof decodeSharedSnapshot>
  readonly diagnostics: readonly Diagnostic[]
}): Promise<PreparePartialXmlSyncPackageResult> {
  const packageId = randomUUID()
  const archiveProjectPath = partialXmlSyncArchiveProjectPath(params.componentPath, packageId)
  const archivePath = join(params.projectDir, ...archiveProjectPath.split("/"))
  let writer: PartialXmlArchiveWriter | undefined
  let pool: FullXmlSyncWorkerPool | undefined
  let retained = false
  try {
    writer = createPartialXmlArchiveWriter({ archivePath })
    let fragmentData: MergedConfigurationSnapshotFragments = { sourceProjectPaths: [], entities: [] }
    const workerDiagnostics: FullXmlSyncDiagnostic[] = []
    if (params.plan.assignments.length > 0) {
      const concurrency = normalizeFullXmlSyncConcurrency(params.concurrency)
      pool = createFullXmlSyncWorkerPool({
        concurrency,
        operation: await params.projectState.workers.beginOperation({
          id: `partial-xml-sync-${packageId}`,
          concurrency,
          context: params.context,
        }),
      })
      await pool.initialize({
        componentPath: params.componentPath,
        componentDir: params.runtime.target.structure.componentDir,
        outputTarget: {
          kind: "memory",
          documentIdsByAssignment: Object.fromEntries(
            [...params.impact.assignmentDocumentIds].map(([path, ids]) => [path, [...ids]]),
          ),
        },
        context: params.context,
        profile: {
          ...params.runtime.workerProfile,
          referencePathByCurrentPath: params.migration.referencePathByCurrentPath,
        },
        composition: createFullXmlSyncCompositionSnapshot(params.plan.assignments),
        targetIndex: params.runtime.target.snapshot,
      })
      const execution = await pool.execute(params.plan.assignments, {
        maxBufferedBatches: concurrency,
        async onBatch(batch) {
          for (const document of batch.generatedDocuments) await writer!.addGenerated(document)
        },
      })
      workerDiagnostics.push(...execution.diagnostics, ...execution.warnings)
      fragmentData = execution.fragmentData
      execution.diagnostics.release()
      execution.warnings.release()
      execution.expectedOutputs.release()
      execution.writtenFiles.release()
      if (workerDiagnostics.some(({ severity }) => severity === "error")) {
        return { ok: false, diagnostics: [...params.diagnostics, ...workerDiagnostics.map((value) => workerDiagnostic(params, value))] }
      }
    }
    for (const external of params.plan.externalFiles) await writer.addExternal(external)
    const archive = await writer.close(params.impact.loadTargets)
    const candidate = buildXmlSyncConfigurationSnapshot({
      previous: params.previous,
      currentFiles: params.runtime.target.hashes.projectFiles,
      currentLogicalAddresses: params.runtime.target.indexes.logicalAddresses,
      fragmentData,
    })
    const candidateBytes = encodeConfigurationIndex(candidate)
    const sourceBytes = sharedSnapshotBytes(params.runtime.target.snapshot)
    const baseSnapshot = params.runtime.base?.snapshot
    const pending: PendingPartialXmlSyncStateV1 = {
      version: 1,
      packageId,
      componentPath: params.componentPath,
      archiveProjectPath,
      archiveHash: hashHex(archive.archiveHash),
      sourceSnapshotHash: hashHex(hashFileBytes(sourceBytes)),
      sourceSnapshotGeneration: params.previous.indexGeneration.toString(),
      candidateSnapshotHash: hashHex(hashFileBytes(candidateBytes)),
      ...(baseSnapshot === undefined ? {} : {
        baseSnapshotHash: hashHex(hashFileBytes(sharedSnapshotBytes(baseSnapshot))),
        baseSnapshotGeneration: decodeSharedSnapshot(baseSnapshot).indexGeneration.toString(),
      }),
      candidateAppliedMigrations: params.migration.candidateAppliedNames,
    }
    await writePendingPartialXmlSync({ projectDir: params.projectDir, state: pending, candidateBytes })
    retained = true
    return {
      ok: true,
      status: "prepared",
      packageId,
      archivePath,
      archiveHash: pending.archiveHash,
      entries: archive.entries,
      loadTargets: params.impact.loadTargets,
      diagnostics: [...params.diagnostics, ...workerDiagnostics.map((value) => workerDiagnostic(params, value))],
    }
  } finally {
    await pool?.close()
    if (!retained) {
      await writer?.abort()
      await cleanupPendingPartialXmlSync(params.projectDir, params.componentPath)
    }
  }
}

function readCompanionReferences(
  params: ValidatedPreparationParams,
  runtime: FullXmlSyncProfileRuntime,
  policies: ReturnType<typeof resolvePartialXmlPackagePolicy>,
): {
  readonly bySource: ReadonlyMap<string, readonly { readonly yamlPath: readonly (string | number)[]; readonly canonical: string }[]>
  readonly targetByCanonical: ReadonlyMap<string, string>
} {
  const sources = runtime.target.structure.resources.flatMap((resource) =>
    resource.kind === "content" && resource.assignment !== undefined
      && (policies.assignments.get(resource.assignment.id)?.companionReferences.length ?? 0) > 0
      ? [resource.projectPath]
      : []
  )
  if (sources.length === 0) return { bySource: new Map(), targetByCanonical: new Map() }
  const session = params.projectState.openReadSession(params.readToken)
  try {
    const results = session.readFileMetadataTargetReferences(sources.map((projectPath, index) => ({
      requestId: String(index),
      componentPath: params.componentPath,
      projectPath: `${params.componentPath}/${projectPath}`,
    })))
    const bySource = new Map<string, readonly { readonly yamlPath: readonly (string | number)[]; readonly canonical: string }[]>()
    const canonicals = new Set<string>()
    results.forEach((result, index) => {
      if (result.status !== "found") return
      const source = sources[index]!
      bySource.set(source, result.references)
      result.references.forEach(({ canonical }) => canonicals.add(canonical))
    })
    const resolved = session.resolveTargets([...canonicals].map((canonical, index) => ({
      requestId: String(index),
      componentPath: params.componentPath,
      canonicalTarget: canonical,
    })))
    const targetByCanonical = new Map<string, string>()
    resolved.forEach((result, index) => {
      if (result.status === "found") {
        targetByCanonical.set(
          [...canonicals][index]!,
          componentRelativePath(params.componentPath, result.source.componentPath, result.source.projectPath),
        )
      }
    })
    return { bySource, targetByCanonical }
  } finally {
    session.close()
  }
}

function decodeSharedSnapshot(snapshot: FullXmlSyncProfileRuntime["target"]["snapshot"]) {
  return decodeConfigurationIndex(sharedSnapshotBytes(snapshot))
}

function sharedSnapshotBytes(snapshot: FullXmlSyncProfileRuntime["target"]["snapshot"]): Uint8Array {
  return new Uint8Array(snapshot.bytes, 0, snapshot.byteLength)
}

function isEmptyChanges(changes: ReturnType<typeof detectPartialXmlChanges>): boolean {
  return changes.added.length === 0 && changes.changed.length === 0 && changes.deleted.length === 0
}

function componentRelativePath(expected: string, actual: string, projectPath: string): string {
  if (actual !== expected) return projectPath
  const prefix = `${expected}/`
  return projectPath.startsWith(prefix) ? projectPath.slice(prefix.length) : projectPath
}

function hasErrors(diagnostics: readonly Diagnostic[]): boolean {
  return diagnostics.some(({ severity }) => severity === "error")
}

function operationDiagnostic(projectDir: string, caught: unknown): Diagnostic {
  return {
    filePath: projectDir,
    line: 1,
    col: 1,
    severity: "error",
    source: "cross-file",
    message: caught instanceof Error ? caught.message : String(caught),
  }
}

function workerDiagnostic(params: ValidatedPreparationParams, value: FullXmlSyncDiagnostic): Diagnostic {
  return {
    filePath: value.sourcePath
      ?? (value.sourceProjectPath === undefined
        ? params.projectDir
        : join(params.projectDir, ...params.componentPath.split("/"), ...value.sourceProjectPath.split("/"))),
    line: value.line ?? 1,
    col: value.col ?? 1,
    severity: value.severity,
    source: "cross-file",
    message: value.message,
  }
}

function hashHex(value: bigint): string {
  return value.toString(16).padStart(16, "0")
}
