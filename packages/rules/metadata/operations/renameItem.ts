import { readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import {
  exportMigrationRenameMap,
  MIGRATIONS_DIR,
  nextMigrationFileName,
} from "../appliedObjects/configuration/migrations"
import { rootFromYAML } from "@nkdk/runtime/rule-kit"
import type { MetadataTargetOwner } from "../ruleRuntime/metadataTarget"
import type { ProjectReferenceLocation } from "../projectState/readSession"
import { applyMetadataOperationFilePlan, type MetadataOperationFileStep } from "./filePlan"
import { readIndexedOperationReferences } from "./indexReferences"
import { hasCaseInsensitiveConflict, validateMetadataLocalName } from "./nameRules"
import { parseMetadataOperationPath } from "./operationPath"
import {
  buildMetadataOperationSnapshotFromProjectPaths,
  type MetadataOperationSnapshot,
  type OperationSnapshotItem,
} from "./projectSnapshot"
import { findFormDataPathValueForItem, rewriteDataPathSegments } from "./dataPathReferences"
import {
  collectStructuralReferencesForItem,
  rewriteCanonicalPrefix,
  type StructuralReferenceCollectionResult,
  type WritableStructuralReferenceInput,
} from "./references"
import {
  hasMetadataOperationErrors,
  metadataOperationFailure,
  metadataOperationValidationFailure,
} from "./results"
import {
  resolveMetadataOperationCanonicalTarget,
  resolveMetadataOperationPath,
  type ResolvedMetadataOperationPath,
  type MetadataOperationRules,
} from "./targetResolver"
import type {
  MetadataOperationDiagnostic,
  MetadataOperationFailure,
  MetadataOperationMigrationInfo,
  MetadataOperationReferenceChange,
  MetadataOperationResult,
  RenameMetadataItemParams,
} from "./types"
import { exportOperationItemToYamlText } from "./yamlIO"

interface RenamePlan {
  readonly steps: MetadataOperationFileStep[]
  readonly plannedChangedFiles: string[]
  readonly rewrittenReferences: MetadataOperationReferenceChange[]
  readonly createdMigration?: MetadataOperationMigrationInfo
}

type RenamePlanResult = { ok: true; plan: RenamePlan } | { ok: false; failure: MetadataOperationFailure }

export async function renameMetadataItem(
  params: RenameMetadataItemParams,
  rules?: MetadataOperationRules,
): Promise<MetadataOperationResult> {
  const before = await params.projectState.refreshAndValidate({ projectDir: params.projectDir })
  const beforeDiagnostics = [...before.diagnostics]
  before.diagnostics.release()
  if (hasMetadataOperationErrors(beforeDiagnostics) && params.ignoreValidationErrors !== true) {
    return metadataOperationValidationFailure("YAML-проект содержит ошибки validation", beforeDiagnostics)
  }

  const name = validateMetadataLocalName(params.newName)
  if (!name.ok) return metadataOperationFailure("invalid_name", name.message, beforeDiagnostics)
  const parsedPath = parseMetadataOperationPath(params.path)
  if (!parsedPath.ok) return metadataOperationFailure(parsedPath.code, parsedPath.message, beforeDiagnostics)
  const canonical = resolveMetadataOperationCanonicalTarget(parsedPath, rules)
  if (!canonical.ok) return metadataOperationFailure(canonical.code, canonical.message, beforeDiagnostics)

  const indexed = await readIndexedOperationReferences({
    projectState: params.projectState,
    path: params.path,
    componentPath: params.componentPath,
    target: canonical,
  })
  if (!indexed.ok) return metadataOperationFailure("target_not_found", indexed.message, beforeDiagnostics)

  const snapshot = buildMetadataOperationSnapshotFromProjectPaths({
    projectDir: params.projectDir,
    projectPaths: [
      indexed.source.ownerProjectPath ?? indexed.source.projectPath,
      ...indexed.references.map(({ projectPath }) => projectPath),
    ],
  })
  if (!snapshot.ok) return snapshot
  const resolved = resolveMetadataOperationPath(snapshot, parsedPath, {
    sourceProjectPath: indexed.source.projectPath,
    ...(indexed.source.itemProjectPath === undefined ? {} : { itemProjectPath: indexed.source.itemProjectPath }),
    ...(indexed.source.ownerProjectPath === undefined ? {} : { ownerProjectPath: indexed.source.ownerProjectPath }),
    collectionNames: indexed.collectionNames,
  }, rules)
  if (!resolved.ok) return metadataOperationFailure(resolved.code, resolved.message, beforeDiagnostics)
  if (hasNameConflict(resolved, params.newName)) {
    return metadataOperationFailure("name_conflict", `Имя "${params.newName}" уже занято в этой области имен`, beforeDiagnostics)
  }

  const planResult = buildRenamePlan({
    projectDir: params.projectDir,
    snapshot,
    resolved,
    references: indexed.references,
    fromPrefix: canonical.canonical,
    newName: params.newName,
    allowWrite: params.allowWrite === true,
    now: params.now,
    diagnostics: beforeDiagnostics,
    rules,
  })
  if (!planResult.ok) return planResult.failure
  const plan = planResult.plan
  if (params.allowWrite !== true) return success("plan", plan, plan.plannedChangedFiles, beforeDiagnostics)

  const applied = applyMetadataOperationFilePlan({ steps: plan.steps })
  const after = await params.projectState.refreshAndValidate({ projectDir: params.projectDir })
  const afterDiagnostics = [...after.diagnostics]
  after.diagnostics.release()
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
      diagnostics: afterDiagnostics,
    }
  }
  return success("applied", plan, applied.changedFiles, afterDiagnostics)
}

function buildRenamePlan(params: {
  projectDir: string
  snapshot: MetadataOperationSnapshot
  resolved: ResolvedMetadataOperationPath
  references: readonly ProjectReferenceLocation[]
  fromPrefix: string
  newName: string
  allowWrite: boolean
  now?: Date
  diagnostics: MetadataOperationDiagnostic[]
  rules?: MetadataOperationRules
}): RenamePlanResult {
  const touchedItems = new Set<OperationSnapshotItem>()
  const itemsByProjectPath = new Map(params.snapshot.items.map((item) => [item.resource.rootProjectPath, item]))
  const structuralReferencesByItem = new Map<OperationSnapshotItem, StructuralReferenceIndexResult>()
  const commitStructuralRewrites = new Set<() => void>()
  if (params.resolved.targetKind === "namedCollection") {
    params.resolved.renameYaml(params.newName)
    touchedItems.add(params.resolved.item)
  }
  const toPrefix = replaceLastSegment(params.fromPrefix, params.newName)
  const rewrittenReferences: MetadataOperationReferenceChange[] = []
  for (const reference of params.references) {
    const item = itemsByProjectPath.get(reference.projectPath)
    if (item === undefined) {
      return { ok: false, failure: metadataOperationFailure("rule_contract_violation", `Файл ссылки не найден: ${reference.projectPath}`, params.diagnostics) }
    }
    if (reference.kind === "dataPath") {
      const current = findFormDataPathValueForItem(item, reference.yamlPath)
      if (current?.value !== reference.value) {
        return { ok: false, failure: metadataOperationFailure("rule_contract_violation", `DataPath изменился после refresh: ${reference.projectPath}`, params.diagnostics) }
      }
      const to = rewriteDataPathSegments(reference.value, reference.resolvedSegments, reference.segmentIndex, params.newName)
      current.setValue(to)
      touchedItems.add(item)
      rewrittenReferences.push({ filePath: item.filePath, yamlPath: reference.yamlPath, from: reference.value, to })
      continue
    }
    const to = rewriteCanonicalPrefix(reference.canonical, params.fromPrefix, toPrefix)
    if (to === undefined) continue
    const indexedReferences = structuralReferencesByItem.get(item)
      ?? setStructuralReferenceIndex(
        structuralReferencesByItem,
        item,
        buildStructuralReferenceIndex(item, params.snapshot, params.rules),
      )
    if (!indexedReferences.ok) {
      return { ok: false, failure: metadataOperationFailure(indexedReferences.code, indexedReferences.message, params.diagnostics) }
    }
    const structuralReference = indexedReferences.references.get(structuralReferenceKey(reference.canonical, reference.yamlPath))
    if (structuralReference === undefined) {
      return {
        ok: false,
        failure: metadataOperationFailure(
          "rule_contract_violation",
          `Индексированная ссылка не найдена по YAML path в ${item.filePath}`,
          params.diagnostics,
        ),
      }
    }
    structuralReference.stageCanonical(to)
    commitStructuralRewrites.add(structuralReference.commitStaged)
    touchedItems.add(item)
    rewrittenReferences.push({ filePath: item.filePath, yamlPath: reference.yamlPath, from: reference.canonical, to })
  }

  for (const commit of commitStructuralRewrites) commit()

  const steps: MetadataOperationFileStep[] = [...touchedItems].map((item) => ({
    kind: "writeFile",
    path: item.filePath,
    content: exportOperationItemToYamlText(item),
  }))
  if (params.resolved.targetKind === "object") {
    steps.push({
      kind: "renamePath",
      from: params.resolved.item.ownerDirPath,
      to: join(dirname(params.resolved.item.ownerDirPath), params.newName),
    })
  } else if (params.resolved.targetKind === "fileItem") {
    const from = params.resolved.resources[0]!
    steps.push({ kind: "renamePath", from, to: join(dirname(from), params.newName) })
  }

  const createdMigration = buildMigrationInfo(params.resolved, params.newName)
  if (params.allowWrite && createdMigration !== undefined) {
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
      rewrittenReferences,
      createdMigration,
    },
  }
}

type StructuralReferenceIndexResult =
  | { readonly ok: true; readonly references: ReadonlyMap<string, WritableStructuralReferenceInput> }
  | Extract<StructuralReferenceCollectionResult, { ok: false }>

function buildStructuralReferenceIndex(
  item: OperationSnapshotItem,
  snapshot: MetadataOperationSnapshot,
  rules?: MetadataOperationRules,
): StructuralReferenceIndexResult {
  const collected = collectStructuralReferencesForItem({
    item,
    parsed: item.parsed,
    owner: ownerForItem(item),
    context: snapshot.context,
    rules,
  })
  if (!collected.ok) return collected
  return {
    ok: true,
    references: new Map(collected.references.map((reference) => [
      structuralReferenceKey(reference.canonical, reference.yamlPath),
      reference,
    ])),
  }
}

function setStructuralReferenceIndex(
  indexes: Map<OperationSnapshotItem, StructuralReferenceIndexResult>,
  item: OperationSnapshotItem,
  index: StructuralReferenceIndexResult,
): StructuralReferenceIndexResult {
  indexes.set(item, index)
  return index
}

function structuralReferenceKey(canonical: string, yamlPath: readonly (string | number)[]): string {
  return JSON.stringify([canonical, yamlPath])
}

function hasNameConflict(resolved: ResolvedMetadataOperationPath, newName: string): boolean {
  const existingNames = resolved.targetKind === "object"
    ? readdirSync(dirname(resolved.item.ownerDirPath), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map(({ name }) => name)
    : resolved.collectionNames
  return hasCaseInsensitiveConflict({ existingNames, currentName: resolved.currentName, nextName: newName })
}

function ownerForItem(item: OperationSnapshotItem): MetadataTargetOwner | undefined {
  const root = rootFromYAML[item.resource.owner.dir]
  return root ? { root, objectName: item.resource.owner.name } : undefined
}

function buildMigrationInfo(resolved: ResolvedMetadataOperationPath, newName: string): MetadataOperationMigrationInfo | undefined {
  if (!resolved.requiresMigration || !resolved.migrationPath) return undefined
  return { from: resolved.migrationPath, to: replaceLastSegment(resolved.migrationPath, newName) }
}

function success(
  mode: "plan" | "applied",
  plan: RenamePlan,
  changedFiles: string[],
  diagnostics: MetadataOperationDiagnostic[],
): MetadataOperationResult {
  return {
    ok: true,
    mode,
    changedFiles,
    rewrittenReferences: plan.rewrittenReferences,
    createdMigration: plan.createdMigration,
    blockedReferences: [],
    diagnostics,
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
