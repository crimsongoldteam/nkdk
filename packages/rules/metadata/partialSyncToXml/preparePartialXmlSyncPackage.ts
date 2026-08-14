import { randomBytes, randomUUID } from "node:crypto"
import { readFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { componentPath, hashFileBytes, parseComponentPath } from "@nkdk/runtime"
import {
  openConfigurationIndexStore,
  type ConfigurationIndexPendingDelta,
} from "@nkdk/runtime/configuration-index-store"
import type { ConfigurationIndexBlock } from "@nkdk/runtime"
import type { ConfigurationContext } from "@nkdk/runtime"
import type { Diagnostic } from "@nkdk/runtime"
import {
  resolveFullXmlSyncComponentProfile,
  type FullXmlSyncProfileRuntime,
} from "../fullSyncToXml/componentProfile"
import { attachBorrowedFormPaths } from "../fullSyncToXml/borrowedFormPlan"
import { readProfileComponentStates } from "../fullSyncToXml/componentRuntime"
import { buildXmlSyncPlan } from "../fullSyncToXml/selection"
import { createFullXmlSyncCompositionSnapshot } from "../fullSyncToXml/sharedMetadata"
import type { FullXmlSyncAssignment, FullXmlSyncDiagnostic, FullXmlSyncPlan } from "../fullSyncToXml/types"
import { withConfigurationIndexSources } from "../fullSyncToXml/configurationIndexSources"
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
import { detectPartialXmlChanges, supplementCurrentVersions } from "./changeDetector"
import { buildPartialXmlImpactPlan } from "./impactPlanner"
import { evaluatePartialXmlSyncMigrationState } from "./migrationState"
import { resolvePartialXmlPackagePolicy } from "./packagePolicy"
import {
  assertNoPendingPartialXmlSync,
  cleanupPendingPartialXmlSync,
  partialXmlSyncArchiveProjectPath,
  readPendingPartialXmlSync,
  writePendingPartialXmlSync,
  type PendingPartialXmlSyncStateV3,
} from "./pendingStore"
import { createPartialXmlArchiveWriter, type PartialXmlArchiveWriter } from "./archiveWriter"

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
  readonly readPending: typeof readPendingPartialXmlSync
  readonly refresh: (params: PreparePartialXmlSyncPackageParams) => Promise<{
    readonly diagnostics: readonly Diagnostic[]
    readonly readToken: ProjectStateReadToken
  }>
  readonly prepareValidated: (params: ValidatedPreparationParams) => Promise<PreparePartialXmlSyncPackageResult>
}

const defaultDependencies: PartialXmlSyncCoordinatorDependencies = {
  readPending: readPendingPartialXmlSync,
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
    const pending = await dependencies.readPending(projectDir, normalizedComponentPath)
    if (pending !== undefined) throw new Error(`Для компонента ${normalizedComponentPath} существует ожидающий пакет`)
    await assertNoPendingPartialXmlSync(projectDir, normalizedComponentPath)
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
      readHashes: readComponentHashState,
      readIndexes: readComponentIndexes,
      confirmState: confirmComponentState,
    },
  })
  const runtime = await profile.confirm(states)
  const currentVersions = await supplementCurrentVersions({
    current: runtime.target.hashes.projectFiles,
    previous: runtime.target.snapshot.projectFiles,
    async read(projectPath) {
      try {
        const content = await readFile(join(runtime.target.structure.componentDir, ...projectPath.split("/")))
        return { projectPath, contentHash: hashFileBytes(content) }
      } catch (caught) {
        if (isMissingFile(caught)) return undefined
        throw caught
      }
    },
  })
  const changes = detectPartialXmlChanges({
    current: currentVersions,
    previous: runtime.target.snapshot.projectFiles,
  })
  const migration = await evaluatePartialXmlSyncMigrationState({
    projectDir: params.projectDir,
    componentPath: params.componentPath,
    componentDir: runtime.target.structure.componentDir,
    hasFileChanges: !isEmptyChanges(changes),
  })
  const diagnostics = params.diagnostics
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
  const plan = attachBorrowedFormPaths(buildXmlSyncPlan({
    structure: runtime.target.structure,
    hashes: runtime.target.hashes,
    selection: impact.selection,
  }), runtime)
  const compositionPlan = attachBorrowedFormPaths(buildXmlSyncPlan({
    structure: runtime.target.structure,
    hashes: runtime.target.hashes,
    selection: { kind: "all" },
  }), runtime)
  return writePreparedPackage({
    ...params,
    runtime,
    plan,
    compositionAssignments: compositionPlan.assignments,
    impact,
    migration,
    changes,
    diagnostics,
  })
}

function isMissingFile(caught: unknown): caught is NodeJS.ErrnoException {
  return caught instanceof Error && "code" in caught && caught.code === "ENOENT"
}

async function writePreparedPackage(params: ValidatedPreparationParams & {
  readonly runtime: FullXmlSyncProfileRuntime
  readonly plan: FullXmlSyncPlan
  readonly compositionAssignments: readonly FullXmlSyncAssignment[]
  readonly impact: ReturnType<typeof buildPartialXmlImpactPlan>
  readonly migration: Awaited<ReturnType<typeof evaluatePartialXmlSyncMigrationState>>
  readonly changes: ReturnType<typeof detectPartialXmlChanges>
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
    const rebuiltBlocks = new Map<string, ConfigurationIndexBlock>()
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
        composition: createFullXmlSyncCompositionSnapshot(params.compositionAssignments),
        targetIndex: params.runtime.target.snapshot.descriptor,
        ...(params.runtime.base === undefined ? {} : { baseIndex: params.runtime.base.snapshot.descriptor }),
        operationSeed: randomBytes(32),
      })
      const assignments = params.plan.assignments.map((assignment) => withConfigurationIndexSources({
        assignment,
        targetLogicalAddresses: params.runtime.target.indexes.logicalAddresses,
        ...(params.runtime.base === undefined ? {} : { baseLogicalAddresses: params.runtime.base.indexes.logicalAddresses }),
      }))
      const execution = await pool.execute(assignments, {
        maxBufferedBatches: concurrency,
        async onBatch(batch) {
          for (const document of batch.generatedDocuments) await writer!.addGenerated(document)
          for (const fragment of batch.configurationFragments) mergePartialBlock(rebuiltBlocks, fragment)
        },
      })
      workerDiagnostics.push(...execution.diagnostics, ...execution.warnings)
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
    const delta = await buildPendingDelta(params, rebuiltBlocks)
    const pending: PendingPartialXmlSyncStateV3 = {
      version: 3,
      packageId,
      componentPath: params.componentPath,
      archiveProjectPath,
      archiveHash: hashHex(archive.archiveHash),
      candidateAppliedMigrations: params.migration.candidateAppliedNames,
      entries: archive.entries,
      loadTargets: params.impact.loadTargets,
      delivery: { status: "prepared" },
    }
    await writePendingPartialXmlSync({ projectDir: params.projectDir, state: pending, delta })
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

async function buildPendingDelta(
  params: Pick<Parameters<typeof writePreparedPackage>[0], "changes" | "runtime">,
  rebuiltBlocks: ReadonlyMap<string, ConfigurationIndexBlock>,
): Promise<ConfigurationIndexPendingDelta> {
  const hashes = new Map<string, { kind: "put"; contentHash: bigint } | { kind: "delete" }>()
  for (const file of params.changes.added) hashes.set(file.projectPath, { kind: "put", contentHash: file.contentHash })
  for (const { current } of params.changes.changed) {
    hashes.set(current.projectPath, { kind: "put", contentHash: current.contentHash })
  }
  for (const file of params.changes.deleted) hashes.set(file.projectPath, { kind: "delete" })

  const blocks = new Map<string, { kind: "put"; block: ConfigurationIndexBlock } | { kind: "delete" }>()
  for (const [projectPath, block] of rebuiltBlocks) {
    blocks.set(projectPath, block.entities.length === 0 ? { kind: "delete" } : { kind: "put", block })
  }
  const store = openConfigurationIndexStore(params.runtime.target.snapshot.descriptor, "readOnly")
  try {
    for (const file of params.changes.deleted) {
      if (store.hasBlock(file.projectPath)) blocks.set(file.projectPath, { kind: "delete" })
    }
  } finally {
    await store.close()
  }
  return { hashes, blocks }
}

function mergePartialBlock(
  blocks: Map<string, ConfigurationIndexBlock>,
  fragment: { readonly targetProjectPath: string; readonly entities: ConfigurationIndexBlock["entities"] },
): void {
  if (fragment.entities.length === 0) {
    blocks.set(fragment.targetProjectPath, { entities: [] })
    return
  }
  const merged = new Map((blocks.get(fragment.targetProjectPath)?.entities ?? []).map((entity) => [entity.logicalAddress, entity]))
  for (const entity of fragment.entities) {
    const previous = merged.get(entity.logicalAddress)
    if (previous !== undefined && JSON.stringify(previous) !== JSON.stringify(entity)) {
      throw new Error(`Конфликт блока ${fragment.targetProjectPath}: ${entity.logicalAddress}`)
    }
    merged.set(entity.logicalAddress, entity)
  }
  blocks.set(fragment.targetProjectPath, { entities: [...merged.values()] })
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
