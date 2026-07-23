import { dirname, join } from "path"
import { MIGRATIONS_DIR, nextMigrationFileName } from "../appliedObjects/configuration/migrations"
import { rootFromYAML } from "../commonObjects/metadataTargets/roots"
import type { MetadataTargetOwner } from "../commonObjects/metadataTargets"
import { prepareYamlProject, prepareYamlProjectWithPool } from "../project/preparedYamlProject"
import {
  collectFormDataPathReferencesForItem,
  createOperationDataPathOwnerCache,
  rewriteDataPathSegments,
} from "./dataPathReferences"
import { applyMetadataOperationFilePlan, type MetadataOperationFileStep } from "./filePlan"
import { hasCaseInsensitiveConflict, validateMetadataLocalName } from "./nameRules"
import { parseMetadataOperationPath } from "./operationPath"
import {
  buildMetadataOperationSnapshotFromPreparedProject,
  type MetadataOperationSnapshot,
  type OperationSnapshotItem,
} from "./projectSnapshot"
import {
  collectStructuralReferencesForItem,
  rewriteCanonicalPrefix,
  type StructuralReferenceCollectionResult,
} from "./references"
import { resolveMetadataOperationPath, type ResolvedMetadataOperationPath } from "./targetResolver"
import type {
  MetadataOperationFailure,
  MetadataOperationMigrationInfo,
  MetadataOperationMode,
  MetadataOperationReferenceChange,
  MetadataOperationResult,
  MetadataOperationValidationFailed,
  RenameMetadataItemParams,
} from "./types"
import { defaultMetadataOperationsContext } from "./context"
import { exportOperationItemToYamlText } from "./yamlIO"

interface RenamePlan {
  steps: MetadataOperationFileStep[]
  plannedChangedFiles: string[]
  rewrittenReferences: MetadataOperationReferenceChange[]
  createdMigration?: MetadataOperationMigrationInfo
}

type RenamePlanResult = { ok: true; plan: RenamePlan } | { ok: false; failure: MetadataOperationFailure }
type StructuralReferenceRewriteResult =
  | { ok: true; references: MetadataOperationReferenceChange[] }
  | { ok: false; code: "rule_contract_violation"; message: string }

export async function renameMetadataItem(params: RenameMetadataItemParams): Promise<MetadataOperationResult> {
  const context = defaultMetadataOperationsContext()
  const prepared =
    params.preparedYamlProjectPool !== undefined
      ? await prepareYamlProjectWithPool({
          projectDir: params.projectDir,
          context,
          pool: params.preparedYamlProjectPool,
        })
      : await prepareYamlProject({ projectDir: params.projectDir, context })
  if (!prepared.ok) return validationFailure(prepared.message, prepared.diagnostics)
  const syntaxErrors = prepared.project.workers
    .flatMap((worker) => worker.yamlFiles)
    .flatMap((file) => file.syntaxDiagnostics)
    .filter((diagnostic) => diagnostic.severity === "error")
  if (syntaxErrors.length > 0) return validationFailure("YAML-проект содержит ошибки подготовки", syntaxErrors)

  const snapshot = buildMetadataOperationSnapshotFromPreparedProject({
    project: prepared.project,
    context,
    requireValidProject: false,
  })
  if (!snapshot.ok) return snapshot

  const name = validateMetadataLocalName(params.newName)
  if (!name.ok) return failure("invalid_name", name.message)

  const parsedPath = parseMetadataOperationPath(params.path)
  if (!parsedPath.ok) return failure(parsedPath.code, parsedPath.message)

  const resolved = resolveMetadataOperationPath(snapshot, parsedPath)
  if (!resolved.ok) return failure(resolved.code, resolved.message)

  if (
    hasCaseInsensitiveConflict({
      existingNames: resolved.collectionNames,
      currentName: resolved.currentName,
      nextName: params.newName,
    })
  ) {
    return failure("name_conflict", `Имя "${params.newName}" уже занято в этой области имен`)
  }

  const planResult = buildRenamePlan({
    projectDir: params.projectDir,
    snapshot,
    resolved,
    newName: params.newName,
    allowWrite: params.allowWrite === true,
    now: params.now,
  })
  if (!planResult.ok) return planResult.failure
  const plan = planResult.plan

  if (params.allowWrite !== true) return success("plan", plan, plan.plannedChangedFiles)

  const applied = applyMetadataOperationFilePlan({ steps: plan.steps })
  if (!applied.ok) {
    return {
      ok: false,
      code: "write_failed",
      message: applied.message,
      changedFiles: applied.appliedFiles,
      rewrittenReferences: plan.rewrittenReferences,
      blockedReferences: [],
      failedStep: applied.failedStep,
      appliedFiles: applied.appliedFiles,
      pendingFiles: applied.pendingFiles,
    }
  }

  return success("applied", plan, applied.changedFiles)
}

function validationFailure(
  message: string,
  diagnostics: MetadataOperationValidationFailed["diagnostics"]
): MetadataOperationValidationFailed {
  return {
    ok: false,
    code: "validation_failed",
    message,
    diagnostics,
  }
}

function buildRenamePlan(params: {
  projectDir: string
  snapshot: MetadataOperationSnapshot
  resolved: ResolvedMetadataOperationPath
  newName: string
  allowWrite: boolean
  now?: Date
}): RenamePlanResult {
  const touchedItems = new Set<OperationSnapshotItem>()
  if (params.resolved.targetKind === "namedCollection") {
    params.resolved.renameYaml(params.newName)
    touchedItems.add(params.resolved.item)
  }

  const rewrittenReferences = rewriteStructuralReferences({
    snapshot: params.snapshot,
    fromPrefix: params.resolved.targetPrefix,
    toPrefix: replaceLastSegment(params.resolved.targetPrefix, params.newName),
    touchedItems,
  })
  if (!rewrittenReferences.ok) {
    return { ok: false, failure: failure(rewrittenReferences.code, rewrittenReferences.message) }
  }
  const rewrittenDataPaths = rewriteDataPathReferences({
    snapshot: params.snapshot,
    targetPrefix: params.resolved.targetPrefix,
    nextName: params.newName,
    touchedItems,
  })

  const steps: MetadataOperationFileStep[] = [...touchedItems].map((item) => ({
    kind: "writeFile" as const,
    path: item.filePath,
    content: exportOperationItemToYamlText(item),
  }))

  if (params.resolved.targetKind === "object") {
    steps.push({
      kind: "renamePath",
      from: params.resolved.item.ownerDirPath,
      to: join(dirname(params.resolved.item.ownerDirPath), params.newName),
    })
  }
  if (params.resolved.targetKind === "fileItem") {
    const from = dirname(params.resolved.absolutePath)
    steps.push({ kind: "renamePath", from, to: join(dirname(from), params.newName) })
  }

  const createdMigration = buildMigrationInfo(params.resolved, params.newName)
  if (params.allowWrite && createdMigration) {
    const fileName = nextMigrationFileName(params.projectDir, params.now)
    createdMigration.fileName = fileName
    steps.push({
      kind: "writeFile",
      path: join(params.projectDir, MIGRATIONS_DIR, fileName),
      content: exportMigrationRenameMap({ [createdMigration.from]: params.newName }),
    })
  }

  return {
    ok: true,
    plan: {
      steps,
      plannedChangedFiles: steps.flatMap(filesForStep),
      rewrittenReferences: [...rewrittenReferences.references, ...rewrittenDataPaths],
      createdMigration,
    },
  }
}

function exportMigrationRenameMap(value: Record<string, string>): string {
  return Object.entries(value)
    .map(([key, item]) => `${JSON.stringify(key)}: ${item}\n`)
    .join("")
}

function rewriteStructuralReferences(params: {
  snapshot: MetadataOperationSnapshot
  fromPrefix: string
  toPrefix: string
  touchedItems: Set<OperationSnapshotItem>
}): StructuralReferenceRewriteResult {
  const changes: MetadataOperationReferenceChange[] = []
  for (const item of params.snapshot.items) {
    const collected = collectItemReferences(item, params.snapshot.context)
    if (!collected.ok) return collected
    for (const reference of collected.references) {
      const to = rewriteCanonicalPrefix(reference.canonical, params.fromPrefix, params.toPrefix)
      if (to === undefined) continue
      reference.setCanonical(to)
      params.touchedItems.add(item)
      changes.push({ filePath: reference.filePath, yamlPath: reference.yamlPath, from: reference.canonical, to })
    }
  }
  return { ok: true, references: changes }
}

function rewriteDataPathReferences(params: {
  snapshot: MetadataOperationSnapshot
  targetPrefix: string
  nextName: string
  touchedItems: Set<OperationSnapshotItem>
}): MetadataOperationReferenceChange[] {
  const ownerCache = createOperationDataPathOwnerCache({
    projectDir: params.snapshot.projectDir,
    context: params.snapshot.context,
  })
  const changes: MetadataOperationReferenceChange[] = []

  for (const item of params.snapshot.items) {
    for (const reference of collectFormDataPathReferencesForItem({
      item,
      ownerCache,
      targetPrefix: params.targetPrefix,
    })) {
      const to = rewriteDataPathSegments(
        reference.value,
        reference.target.segments,
        reference.segmentIndex,
        params.nextName
      )
      if (to === reference.value) continue

      reference.setValue(to)
      params.touchedItems.add(reference.item)
      changes.push({ filePath: reference.filePath, yamlPath: reference.yamlPath, from: reference.value, to })
    }
  }

  return changes
}

function collectItemReferences(
  item: OperationSnapshotItem,
  context: MetadataOperationSnapshot["context"]
): StructuralReferenceCollectionResult {
  return collectStructuralReferencesForItem({
    item,
    parsed: item.parsed,
    owner: ownerForItem(item),
    context,
  })
}

function ownerForItem(item: OperationSnapshotItem): MetadataTargetOwner | undefined {
  const root = rootFromYAML[item.resource.owner.dir]
  return root ? { root, objectName: item.resource.owner.name } : undefined
}

function buildMigrationInfo(
  resolved: ResolvedMetadataOperationPath,
  newName: string
): MetadataOperationMigrationInfo | undefined {
  if (!resolved.requiresMigration || !resolved.migrationPath) return undefined
  return { from: resolved.migrationPath, to: replaceLastSegment(resolved.migrationPath, newName) }
}

function success(mode: MetadataOperationMode, plan: RenamePlan, changedFiles: string[]): MetadataOperationResult {
  return {
    ok: true,
    mode,
    changedFiles,
    rewrittenReferences: plan.rewrittenReferences,
    createdMigration: plan.createdMigration,
    blockedReferences: [],
  }
}

function failure(code: MetadataOperationFailure["code"], message: string): MetadataOperationFailure {
  return {
    ok: false,
    code,
    message,
    changedFiles: [],
    rewrittenReferences: [],
    blockedReferences: [],
  }
}

function replaceLastSegment(path: string, nextName: string): string {
  const dot = path.lastIndexOf(".")
  return dot < 0 ? nextName : `${path.slice(0, dot + 1)}${nextName}`
}

function filesForStep(step: MetadataOperationFileStep): string[] {
  if (step.kind === "writeFile") return [step.path]
  if (step.kind === "renamePath") return [step.from, step.to]
  if (step.kind === "removePath") return [step.path]
  return []
}
