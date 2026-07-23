import { existsSync, readdirSync } from "fs"
import { join } from "path"
import { rootFromYAML } from "../commonObjects/metadataTargets/roots"
import { getTypeRule } from "../orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { MetadataRuleOperationTargetDescriptor } from "../project/ruleResources"
import { describeMetadataRuleOperationTargets } from "../project/ruleResources"
import type { ParsedMetadataOperationPath, ParsedMetadataOperationPathSegment } from "./operationPath"
import type { MetadataOperationSnapshot, OperationSnapshotItem } from "./projectSnapshot"
import type { MetadataFileItemRole, MetadataNamedChildKind } from "./types"

type FileItemTargetDescriptor = MetadataRuleOperationTargetDescriptor & {
  declaration: Extract<MetadataRuleOperationTargetDescriptor["declaration"], { kind: "fileItemCollectionTarget" }>
}

export interface ResolvedMetadataOperationPath {
  ok: true
  displayPath: string
  item: OperationSnapshotItem
  yamlNode: Record<string, unknown>
  renameYaml(nextName: string): void
  currentName: string
  collectionProperty?: string
  collectionNames: string[]
  projectPath: string
  absolutePath: string
  resources: string[]
  requiresMigration: boolean
  migrationPath?: string
  targetPrefix: string
  targetKind: "object" | "namedCollection" | "fileItem"
}

export interface ResolveMetadataOperationPathFailure {
  ok: false
  code: "target_not_found" | "unsupported_target"
  message: string
}

export function resolveMetadataOperationPath(
  snapshot: MetadataOperationSnapshot,
  path: ParsedMetadataOperationPath
): ResolvedMetadataOperationPath | ResolveMetadataOperationPathFailure {
  if (path.chain.length === 0) return resolveObjectTarget(snapshot, path)
  return resolveChainedTarget(snapshot, path)
}

function resolveObjectTarget(
  snapshot: MetadataOperationSnapshot,
  path: ParsedMetadataOperationPath
): ResolvedMetadataOperationPath | ResolveMetadataOperationPathFailure {
  const item = findOwner(snapshot, path.owner)
  if (!item) return targetNotFound(`Объект не найден: ${path.owner.itemTypePrefix}.${path.owner.name}`)

  const displayPath = `${path.owner.itemTypePrefix}.${path.owner.name}`
  return {
    ok: true,
    displayPath,
    item,
    yamlNode: item.yaml,
    renameYaml: () => undefined,
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
  path: ParsedMetadataOperationPath
): ResolvedMetadataOperationPath | ResolveMetadataOperationPathFailure {
  const item = findOwner(snapshot, path.owner)
  if (!item) return targetNotFound(`Владелец не найден: ${path.owner.itemTypePrefix}.${path.owner.name}`)

  let currentRule = item.resource.owner.spec.rule
  let currentNode = item.yaml
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

    const resolvedCollection = resolveYamlCollectionItem({
      owner: currentNode,
      ownerRule: currentRule,
      propertyName: descriptor.propertyName,
      name: segment.name,
    })
    if (!resolvedCollection) return targetNotFound(`Элемент не найден: ${segment.name}`)

    displayParts.push(descriptor.declaration.migrationSegment, segment.name)
    canonicalParts.push(canonicalNamedKind(descriptor.declaration.targetKind), segment.name)

    if (index === path.chain.length - 1) {
      const displayPath = displayParts.join(".")
      return {
        ok: true,
        displayPath,
        item,
        yamlNode: resolvedCollection.node,
        renameYaml: resolvedCollection.rename,
        currentName: segment.name,
        collectionProperty: descriptor.propertyName,
        collectionNames: resolvedCollection.names,
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
    currentNode = resolvedCollection.node
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
}): ResolvedMetadataOperationPath | ResolveMetadataOperationPathFailure {
  const folderPath = join(
    params.snapshot.projectDir,
    params.path.owner.itemTypePrefix,
    params.path.owner.name,
    params.descriptor.declaration.folderName
  )
  const itemDir = join(folderPath, params.segment.name)
  const yamlPath = join(itemDir, params.descriptor.declaration.yamlFileName)
  if (!existsSync(yamlPath)) return targetNotFound(`Файловый элемент не найден: ${params.segment.name}`)

  const displayPath = [
    ...params.displayParts,
    params.descriptor.declaration.migrationSegment,
    params.segment.name,
  ].join(".")
  return {
    ok: true,
    displayPath,
    item: params.item,
    yamlNode: {},
    renameYaml: () => undefined,
    currentName: params.segment.name,
    collectionProperty: params.descriptor.propertyName,
    collectionNames: fileItemNames(folderPath, params.descriptor.declaration.yamlFileName),
    projectPath: `${params.path.owner.itemTypePrefix}/${params.path.owner.name}/${params.descriptor.declaration.folderName}/${params.segment.name}/${params.descriptor.declaration.yamlFileName}`,
    absolutePath: yamlPath,
    resources: [itemDir, yamlPath],
    requiresMigration: false,
    targetPrefix: [
      ...params.canonicalParts,
      canonicalFileItemKind(params.descriptor.declaration.role),
      params.segment.name,
    ].join("."),
    targetKind: "fileItem",
  }
}

function findTargetDescriptor(
  rule: MetadataItemRule,
  segment: ParsedMetadataOperationPathSegment
): MetadataRuleOperationTargetDescriptor | undefined {
  return describeMetadataRuleOperationTargets(rule).find((candidate) => {
    const declaration = candidate.declaration
    if (declaration.kind === "namedCollectionTarget") return declaration.migrationSegment === segment.collectionSegment
    if (declaration.kind === "fileItemCollectionTarget")
      return declaration.migrationSegment === segment.collectionSegment
    return false
  })
}

function isFileItemTargetDescriptor(
  descriptor: MetadataRuleOperationTargetDescriptor
): descriptor is FileItemTargetDescriptor {
  return descriptor.declaration.kind === "fileItemCollectionTarget"
}

function findOwner(
  snapshot: MetadataOperationSnapshot,
  owner: { itemTypePrefix: string; name: string }
): OperationSnapshotItem | undefined {
  return snapshot.items.find(
    (item) => item.resource.owner.dir === owner.itemTypePrefix && item.resource.owner.name === owner.name
  )
}

function resolveYamlCollectionItem(params: {
  owner: Record<string, unknown>
  ownerRule: MetadataItemRule
  propertyName: string
  name: string
}): { node: Record<string, unknown>; names: string[]; rename(nextName: string): void } | undefined {
  const propertyRule = params.ownerRule.properties[params.propertyName]
  if (propertyRule?.yaml === undefined) return undefined
  const descriptor = getTypeRule(propertyRule.type, "yamlToXMLNestedRule")
  if (descriptor?.kind !== "collection") return undefined
  const collection = params.owner[propertyRule.yaml]

  if (descriptor.yamlShape === "record") {
    if (!isRecord(collection)) return undefined
    const entry = Object.entries(collection).find(([key]) => {
      const resolvedName =
        descriptor.nameFromYAMLKeyForProperty?.({ yamlKey: key, propertyRule }) ??
        descriptor.nameFromYAMLKey?.(key) ??
        key
      return resolvedName === params.name
    })
    if (entry === undefined || !isRecord(entry[1])) return undefined
    const [yamlKey, node] = entry
    return {
      node,
      names: Object.keys(collection).map(
        (key) =>
          descriptor.nameFromYAMLKeyForProperty?.({ yamlKey: key, propertyRule }) ??
          descriptor.nameFromYAMLKey?.(key) ??
          key
      ),
      rename: (nextName) => renameRecordKeyPreservingOrder(collection, yamlKey, nextName),
    }
  }

  if (!Array.isArray(collection)) return undefined
  const keyField = descriptor.keyField ?? "name"
  const keyRule = descriptor.itemRule.properties[keyField]
  const yamlKey = keyRule?.yaml
  if (yamlKey === undefined) return undefined
  const items = collection.filter(isRecord)
  const node = items.find((item) => item[yamlKey] === params.name)
  if (node === undefined) return undefined
  return {
    node,
    names: items.flatMap((item) => (typeof item[yamlKey] === "string" ? [item[yamlKey] as string] : [])),
    rename: (nextName) => {
      node[yamlKey] = nextName
    },
  }
}

function renameRecordKeyPreservingOrder(record: Record<string, unknown>, currentName: string, nextName: string): void {
  const entries = Object.entries(record).map(([key, value]) => [key === currentName ? nextName : key, value] as const)
  for (const key of Object.keys(record)) delete record[key]
  for (const [key, value] of entries) record[key] = value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
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

function targetNotFound(message: string): ResolveMetadataOperationPathFailure {
  return { ok: false, code: "target_not_found", message }
}

function unsupportedTarget(message: string): ResolveMetadataOperationPathFailure {
  return { ok: false, code: "unsupported_target", message }
}
