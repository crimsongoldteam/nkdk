import { existsSync, readdirSync } from "fs"
import { join } from "path"
import { describeMetadataRuleOperationTargets } from "~/metadata/project/ruleResources"
import type { MetadataOperationSnapshot, OperationSnapshotItem } from "./projectSnapshot"
import type { MetadataOperationTarget } from "./types"

export interface ResolvedMetadataOperationTarget {
  ok: true
  target: MetadataOperationTarget
  displayPath: string
  item: OperationSnapshotItem
  modelNode: Record<string, unknown>
  collectionProperty?: string
  collectionNames: string[]
  projectPath: string
  absolutePath: string
  resources: string[]
  requiresMigration: boolean
  migrationPath?: string
  targetPrefix: string
}

export interface ResolveMetadataOperationTargetFailure {
  ok: false
  code: "target_not_found" | "unsupported_target"
  message: string
}

export function resolveMetadataOperationTarget(
  snapshot: MetadataOperationSnapshot,
  target: MetadataOperationTarget,
): ResolvedMetadataOperationTarget | ResolveMetadataOperationTargetFailure {
  if (target.kind === "object") return resolveObjectTarget(snapshot, target)
  if (target.kind === "fileItem") return resolveFileItemTarget(snapshot, target)
  return resolveNamedCollectionTarget(snapshot, target)
}

function resolveObjectTarget(
  snapshot: MetadataOperationSnapshot,
  target: Extract<MetadataOperationTarget, { kind: "object" }>,
): ResolvedMetadataOperationTarget | ResolveMetadataOperationTargetFailure {
  const item = findOwner(snapshot, { itemTypePrefix: target.itemTypePrefix, name: target.name })
  if (!item) return targetNotFound(`Объект не найден: ${target.itemTypePrefix}.${target.name}`)

  const displayPath = `${target.itemTypePrefix}.${target.name}`
  return {
    ok: true,
    target,
    displayPath,
    item,
    modelNode: item.model,
    collectionNames: snapshot.items
      .filter((candidate) => candidate.resource.owner.dir === target.itemTypePrefix)
      .map((candidate) => candidate.resource.owner.name),
    projectPath: item.resource.projectPath,
    absolutePath: item.filePath,
    resources: [item.ownerDirPath],
    requiresMigration: true,
    migrationPath: displayPath,
    targetPrefix: displayPath,
  }
}

function resolveNamedCollectionTarget(
  snapshot: MetadataOperationSnapshot,
  target: Exclude<MetadataOperationTarget, { kind: "object" } | { kind: "fileItem" }>,
): ResolvedMetadataOperationTarget | ResolveMetadataOperationTargetFailure {
  if (target.parent !== undefined) return unsupportedTarget("Вложенные цели пока не поддержаны этим resolver")

  const item = findOwner(snapshot, target.owner)
  if (!item) return targetNotFound(`Владелец не найден: ${target.owner.itemTypePrefix}.${target.owner.name}`)

  const descriptor = describeMetadataRuleOperationTargets(item.resource.owner.spec.rule).find(
    (candidate) => candidate.declaration.kind === "namedCollectionTarget" && candidate.declaration.targetKind === target.kind,
  )
  if (!descriptor || descriptor.declaration.kind !== "namedCollectionTarget") {
    return unsupportedTarget(`Для типа цели ${target.kind} нет operationTarget-декларации`)
  }

  const collection = namedCollection(item.model[descriptor.propertyName])
  const modelNode = collection.find((candidate) => candidate.name === target.name)
  if (!modelNode) return targetNotFound(`Элемент не найден: ${target.name}`)

  const ownerPath = `${target.owner.itemTypePrefix}.${target.owner.name}`
  const displayPath = `${ownerPath}.${descriptor.declaration.migrationSegment}.${target.name}`
  return {
    ok: true,
    target,
    displayPath,
    item,
    modelNode,
    collectionProperty: descriptor.propertyName,
    collectionNames: collection.map((candidate) => candidate.name),
    projectPath: item.resource.projectPath,
    absolutePath: item.filePath,
    resources: [item.filePath],
    requiresMigration: descriptor.declaration.requiresMigration,
    migrationPath: displayPath,
    targetPrefix: displayPath,
  }
}

function resolveFileItemTarget(
  snapshot: MetadataOperationSnapshot,
  target: Extract<MetadataOperationTarget, { kind: "fileItem" }>,
): ResolvedMetadataOperationTarget | ResolveMetadataOperationTargetFailure {
  const item = findOwner(snapshot, target.owner)
  if (!item) return targetNotFound(`Владелец не найден: ${target.owner.itemTypePrefix}.${target.owner.name}`)

  const descriptor = describeMetadataRuleOperationTargets(item.resource.owner.spec.rule).find(
    (candidate) => candidate.declaration.kind === "fileItemCollectionTarget" && candidate.declaration.role === target.role,
  )
  if (!descriptor || descriptor.declaration.kind !== "fileItemCollectionTarget") {
    return unsupportedTarget(`Для файловой цели ${target.role} нет operationTarget-декларации`)
  }

  const folderPath = join(snapshot.projectDir, target.owner.itemTypePrefix, target.owner.name, descriptor.declaration.folderName)
  const itemDir = join(folderPath, target.name)
  const yamlPath = join(itemDir, descriptor.declaration.yamlFileName)
  if (!existsSync(yamlPath)) return targetNotFound(`Файловый элемент не найден: ${target.name}`)

  const displayPath = `${target.owner.itemTypePrefix}.${target.owner.name}.${roleDisplaySegment(target.role)}.${target.name}`
  return {
    ok: true,
    target,
    displayPath,
    item,
    modelNode: { name: target.name },
    collectionProperty: descriptor.propertyName,
    collectionNames: fileItemNames(folderPath, descriptor.declaration.yamlFileName),
    projectPath: `${target.owner.itemTypePrefix}/${target.owner.name}/${descriptor.declaration.folderName}/${target.name}/${descriptor.declaration.yamlFileName}`,
    absolutePath: yamlPath,
    resources: [itemDir, yamlPath],
    requiresMigration: false,
    targetPrefix: displayPath,
  }
}

function findOwner(
  snapshot: MetadataOperationSnapshot,
  owner: { itemTypePrefix: string; name: string },
): OperationSnapshotItem | undefined {
  return snapshot.items.find((item) => item.resource.owner.dir === owner.itemTypePrefix && item.resource.owner.name === owner.name)
}

function namedCollection(value: unknown): Array<Record<string, unknown> & { name: string }> {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is Record<string, unknown> & { name: string } =>
      typeof item === "object" && item !== null && typeof (item as { name?: unknown }).name === "string",
  )
}

function fileItemNames(folderPath: string, yamlFileName: string): string[] {
  if (!existsSync(folderPath)) return []
  return readdirSync(folderPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => existsSync(join(folderPath, entry.name, yamlFileName)))
    .map((entry) => entry.name)
}

function roleDisplaySegment(role: Extract<MetadataOperationTarget, { kind: "fileItem" }>["role"]): string {
  if (role === "form") return "Форма"
  if (role === "template") return "Макет"
  return "Команда"
}

function targetNotFound(message: string): ResolveMetadataOperationTargetFailure {
  return { ok: false, code: "target_not_found", message }
}

function unsupportedTarget(message: string): ResolveMetadataOperationTargetFailure {
  return { ok: false, code: "unsupported_target", message }
}
