import { dirname, join } from "path"
import { stringify } from "yaml"
import { MIGRATIONS_DIR, nextMigrationFileName } from "~/metadata/appliedObjects/configuration/migrations"
import { rootFromYAML } from "~/metadata/commonObjects/metadataTargets/roots"
import type { MetadataTargetOwner } from "~/metadata/commonObjects/metadataTargets"
import { applyMetadataOperationFilePlan, type MetadataOperationFileStep } from "./filePlan"
import { hasCaseInsensitiveConflict, validateMetadataLocalName } from "./nameRules"
import { buildMetadataOperationSnapshot, type MetadataOperationSnapshot, type OperationSnapshotItem } from "./projectSnapshot"
import { collectStructuralReferencesForItem, rewriteCanonicalPrefix, type StructuralReferenceInput } from "./references"
import { resolveMetadataOperationTarget, type ResolvedMetadataOperationTarget } from "./targetResolver"
import type {
  MetadataOperationFailure,
  MetadataOperationMigrationInfo,
  MetadataOperationMode,
  MetadataOperationReferenceChange,
  MetadataOperationResult,
  MetadataOperationTarget,
} from "./types"
import { exportOperationItemToYamlText } from "./yamlModelIO"

export interface RenameMetadataItemParams {
  projectDir: string
  target: MetadataOperationTarget
  newName: string
  allowWrite?: boolean
  now?: Date
}

interface RenamePlan {
  steps: MetadataOperationFileStep[]
  plannedChangedFiles: string[]
  rewrittenReferences: MetadataOperationReferenceChange[]
  createdMigration?: MetadataOperationMigrationInfo
}

export function renameMetadataItem(params: RenameMetadataItemParams): MetadataOperationResult {
  const snapshot = buildMetadataOperationSnapshot({ projectDir: params.projectDir, requireValidProject: true })
  if (!snapshot.ok) return snapshot

  const name = validateMetadataLocalName(params.newName)
  if (!name.ok) return failure("invalid_name", name.message)

  const resolved = resolveMetadataOperationTarget(snapshot, params.target)
  if (!resolved.ok) return failure(resolved.code, resolved.message)

  if (
    hasCaseInsensitiveConflict({
      existingNames: resolved.collectionNames,
      currentName: localName(params.target),
      nextName: params.newName,
    })
  ) {
    return failure("name_conflict", `Имя "${params.newName}" уже занято в этой области имен`)
  }

  const plan = buildRenamePlan({
    projectDir: params.projectDir,
    snapshot,
    resolved,
    newName: params.newName,
    allowWrite: params.allowWrite === true,
    now: params.now,
  })

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

function buildRenamePlan(params: {
  projectDir: string
  snapshot: MetadataOperationSnapshot
  resolved: ResolvedMetadataOperationTarget
  newName: string
  allowWrite: boolean
  now?: Date
}): RenamePlan {
  const touchedItems = new Set<OperationSnapshotItem>()
  if (params.resolved.target.kind === "object") {
    params.resolved.item.model.name = params.newName
  } else if (params.resolved.target.kind !== "fileItem") {
    params.resolved.modelNode.name = params.newName
    touchedItems.add(params.resolved.item)
  }

  const rewrittenReferences = rewriteStructuralReferences({
    snapshot: params.snapshot,
    fromPrefix: params.resolved.targetPrefix,
    toPrefix: replaceLastSegment(params.resolved.targetPrefix, params.newName),
    touchedItems,
  })

  const steps: MetadataOperationFileStep[] = [...touchedItems].map((item) => ({
    kind: "writeFile" as const,
    path: item.filePath,
    content: exportOperationItemToYamlText(item, params.snapshot.context),
  }))

  if (params.resolved.target.kind === "object") {
    steps.push({
      kind: "renamePath",
      from: params.resolved.item.ownerDirPath,
      to: join(dirname(params.resolved.item.ownerDirPath), params.newName),
    })
  }
  if (params.resolved.target.kind === "fileItem") {
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
      content: stringify({ [createdMigration.from]: params.newName }, { defaultKeyType: "QUOTE_DOUBLE" }),
    })
  }

  return {
    steps,
    plannedChangedFiles: steps.flatMap(filesForStep),
    rewrittenReferences,
    createdMigration,
  }
}

function rewriteStructuralReferences(params: {
  snapshot: MetadataOperationSnapshot
  fromPrefix: string
  toPrefix: string
  touchedItems: Set<OperationSnapshotItem>
}): MetadataOperationReferenceChange[] {
  const changes: MetadataOperationReferenceChange[] = []
  for (const item of params.snapshot.items) {
    for (const reference of collectItemReferences(item)) {
      const to = rewriteCanonicalPrefix(reference.canonical, params.fromPrefix, params.toPrefix)
      if (to === undefined) continue
      reference.setCanonical(to)
      params.touchedItems.add(item)
      changes.push({ filePath: reference.filePath, yamlPath: reference.yamlPath, from: reference.canonical, to })
    }
  }
  return changes
}

function collectItemReferences(item: OperationSnapshotItem): StructuralReferenceInput[] {
  return collectStructuralReferencesForItem({
    item,
    parsed: item.parsed,
    owner: ownerForItem(item),
  })
}

function ownerForItem(item: OperationSnapshotItem): MetadataTargetOwner | undefined {
  const root = rootFromYAML[item.resource.owner.dir]
  return root ? { root, objectName: item.resource.owner.name } : undefined
}

function buildMigrationInfo(
  resolved: ResolvedMetadataOperationTarget,
  newName: string,
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

function localName(target: MetadataOperationTarget): string {
  return target.name
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
