import { existsSync, readdirSync } from "fs"
import { join } from "path"
import { rootFromYAML } from "~/metadata/commonObjects/metadataTargets/roots"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { MetadataRuleOperationTargetDescriptor } from "~/metadata/project/ruleResources"
import { describeMetadataRuleOperationTargets } from "~/metadata/project/ruleResources"
import type { ParsedMetadataOperationPath, ParsedMetadataOperationPathSegment } from "./operationPath"
import type { MetadataOperationSnapshot, OperationSnapshotItem } from "./projectSnapshot"
import type { MetadataFileItemRole, MetadataNamedChildKind } from "./types"

type FileItemTargetDescriptor = MetadataRuleOperationTargetDescriptor & {
  declaration: Extract<MetadataRuleOperationTargetDescriptor["declaration"], { kind: "fileItemCollectionTarget" }>
}

export interface ResolvedMetadataOperationTarget {
  ok: true
  displayPath: string
  item: OperationSnapshotItem
  modelNode: Record<string, unknown>
  currentName: string
  collectionProperty?: string
  collectionOwnerNode?: Record<string, unknown>
  collectionNames: string[]
  projectPath: string
  absolutePath: string
  resources: string[]
  requiresMigration: boolean
  migrationPath?: string
  targetPrefix: string
  targetKind: "object" | "namedCollection" | "fileItem"
}

export interface ResolveMetadataOperationTargetFailure {
  ok: false
  code: "target_not_found" | "unsupported_target"
  message: string
}

export function resolveMetadataOperationTarget(
  snapshot: MetadataOperationSnapshot,
  path: ParsedMetadataOperationPath,
): ResolvedMetadataOperationTarget | ResolveMetadataOperationTargetFailure {
  if (path.chain.length === 0) return resolveObjectTarget(snapshot, path)
  return resolveChainedTarget(snapshot, path)
}

function resolveObjectTarget(
  snapshot: MetadataOperationSnapshot,
  path: ParsedMetadataOperationPath,
): ResolvedMetadataOperationTarget | ResolveMetadataOperationTargetFailure {
  const item = findOwner(snapshot, path.owner)
  if (!item) return targetNotFound(`Объект не найден: ${path.owner.itemTypePrefix}.${path.owner.name}`)

  const displayPath = `${path.owner.itemTypePrefix}.${path.owner.name}`
  return {
    ok: true,
    displayPath,
    item,
    modelNode: item.model,
    currentName: path.owner.name,
    collectionNames: snapshot.items
      .filter((candidate) => candidate.resource.owner.dir === path.owner.itemTypePrefix)
      .map((candidate) => candidate.resource.owner.name),
    projectPath: item.resource.projectPath,
    absolutePath: item.filePath,
    resources: [item.ownerDirPath],
    requiresMigration: true,
    migrationPath: displayPath,
    targetPrefix: canonicalObjectPrefix(path.owner.itemTypePrefix, path.owner.name),
    targetKind: "object",
  }
}

function resolveChainedTarget(
  snapshot: MetadataOperationSnapshot,
  path: ParsedMetadataOperationPath,
): ResolvedMetadataOperationTarget | ResolveMetadataOperationTargetFailure {
  const item = findOwner(snapshot, path.owner)
  if (!item) return targetNotFound(`Владелец не найден: ${path.owner.itemTypePrefix}.${path.owner.name}`)

  let currentRule = item.resource.owner.spec.rule
  let currentNode = item.model
  const displayParts = [path.owner.itemTypePrefix, path.owner.name]
  const canonicalParts = [canonicalObjectPrefix(path.owner.itemTypePrefix, path.owner.name)]

  for (let index = 0; index < path.chain.length; index += 1) {
    const segment = path.chain[index]!
    const descriptor = findTargetDescriptor(currentRule, segment)
    if (!descriptor) {
      return unsupportedTarget(`Для сегмента "${segment.collectionSegment}" нет operationTarget-декларации`)
    }

    if (isFileItemTargetDescriptor(descriptor)) {
      if (index !== path.chain.length - 1) {
        return unsupportedTarget(`Файловая цель "${segment.collectionSegment}" не может иметь вложенные цели`)
      }
      return resolveFileItemTarget({
        snapshot,
        item,
        path,
        descriptor,
        segment,
        displayParts,
        canonicalParts,
      })
    }
    if (descriptor.declaration.kind !== "namedCollectionTarget") {
      return unsupportedTarget(`Для сегмента "${segment.collectionSegment}" нет collection operationTarget-декларации`)
    }

    const collection = namedCollection(currentNode[descriptor.propertyName])
    const modelNode = collection.find((candidate) => candidate.name === segment.name)
    if (!modelNode) return targetNotFound(`Элемент не найден: ${segment.name}`)

    displayParts.push(descriptor.declaration.migrationSegment, segment.name)
    canonicalParts.push(canonicalNamedKind(descriptor.declaration.targetKind), segment.name)

    if (index === path.chain.length - 1) {
      const displayPath = displayParts.join(".")
      return {
        ok: true,
        displayPath,
        item,
        modelNode,
        currentName: segment.name,
        collectionProperty: descriptor.propertyName,
        collectionOwnerNode: currentNode,
        collectionNames: collection.map((candidate) => candidate.name),
        projectPath: item.resource.projectPath,
        absolutePath: item.filePath,
        resources: [item.filePath],
        requiresMigration: descriptor.declaration.requiresMigration,
        migrationPath: descriptor.declaration.requiresMigration ? displayPath : undefined,
        targetPrefix: canonicalParts.join("."),
        targetKind: "namedCollection",
      }
    }

    const nextRule = nestedItemRule(currentRule.properties[descriptor.propertyName])
    if (!nextRule) {
      return unsupportedTarget(`Для сегмента "${segment.collectionSegment}" не описано правило вложенного элемента`)
    }
    currentRule = nextRule
    currentNode = modelNode
  }

  return unsupportedTarget(`Цель не поддержана: ${path.path}`)
}

function resolveFileItemTarget(params: {
  snapshot: MetadataOperationSnapshot
  item: OperationSnapshotItem
  path: ParsedMetadataOperationPath
  descriptor: FileItemTargetDescriptor
  segment: ParsedMetadataOperationPathSegment
  displayParts: string[]
  canonicalParts: string[]
}): ResolvedMetadataOperationTarget | ResolveMetadataOperationTargetFailure {
  const folderPath = join(
    params.snapshot.projectDir,
    params.path.owner.itemTypePrefix,
    params.path.owner.name,
    params.descriptor.declaration.folderName,
  )
  const itemDir = join(folderPath, params.segment.name)
  const yamlPath = join(itemDir, params.descriptor.declaration.yamlFileName)
  if (!existsSync(yamlPath)) return targetNotFound(`Файловый элемент не найден: ${params.segment.name}`)

  const displayPath = [...params.displayParts, params.descriptor.declaration.migrationSegment, params.segment.name].join(".")
  return {
    ok: true,
    displayPath,
    item: params.item,
    modelNode: { name: params.segment.name },
    currentName: params.segment.name,
    collectionProperty: params.descriptor.propertyName,
    collectionOwnerNode: params.item.model,
    collectionNames: fileItemNames(folderPath, params.descriptor.declaration.yamlFileName),
    projectPath: `${params.path.owner.itemTypePrefix}/${params.path.owner.name}/${params.descriptor.declaration.folderName}/${params.segment.name}/${params.descriptor.declaration.yamlFileName}`,
    absolutePath: yamlPath,
    resources: [itemDir, yamlPath],
    requiresMigration: false,
    targetPrefix: [...params.canonicalParts, canonicalFileItemKind(params.descriptor.declaration.role), params.segment.name].join(
      ".",
    ),
    targetKind: "fileItem",
  }
}

function findTargetDescriptor(
  rule: MetadataItemRule,
  segment: ParsedMetadataOperationPathSegment,
): MetadataRuleOperationTargetDescriptor | undefined {
  return describeMetadataRuleOperationTargets(rule).find((candidate) => {
    const declaration = candidate.declaration
    if (declaration.kind === "namedCollectionTarget") return declaration.migrationSegment === segment.collectionSegment
    if (declaration.kind === "fileItemCollectionTarget") return declaration.migrationSegment === segment.collectionSegment
    return false
  })
}

function isFileItemTargetDescriptor(descriptor: MetadataRuleOperationTargetDescriptor): descriptor is FileItemTargetDescriptor {
  return descriptor.declaration.kind === "fileItemCollectionTarget"
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

function nestedItemRule(propRule: MetadataItemRule["properties"][string] | undefined): MetadataItemRule | undefined {
  if (!propRule) return undefined

  const collectionItemRule = getTypeRule(propRule.type, "collectionItemRule")
  if (collectionItemRule?.itemRule) return collectionItemRule.itemRule

  if ("itemRule" in propRule && propRule.itemRule !== undefined) {
    return propRule.itemRule as MetadataItemRule
  }

  return undefined
}

function fileItemNames(folderPath: string, yamlFileName: string): string[] {
  if (!existsSync(folderPath)) return []
  return readdirSync(folderPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => existsSync(join(folderPath, entry.name, yamlFileName)))
    .map((entry) => entry.name)
}

function canonicalObjectPrefix(itemTypePrefix: string, name: string): string {
  return `${rootFromYAML[itemTypePrefix] ?? itemTypePrefix}.${name}`
}

function canonicalNamedKind(kind: MetadataNamedChildKind): string {
  if (kind === "attribute") return "Attribute"
  if (kind === "tabularSection") return "TabularSection"
  if (kind === "dimension") return "Dimension"
  if (kind === "resource") return "Resource"
  if (kind === "addressingAttribute") return "AddressingAttribute"
  return "Command"
}

function canonicalFileItemKind(role: MetadataFileItemRole): string {
  if (role === "form") return "Form"
  if (role === "template") return "Template"
  return "Command"
}

function targetNotFound(message: string): ResolveMetadataOperationTargetFailure {
  return { ok: false, code: "target_not_found", message }
}

function unsupportedTarget(message: string): ResolveMetadataOperationTargetFailure {
  return { ok: false, code: "unsupported_target", message }
}
