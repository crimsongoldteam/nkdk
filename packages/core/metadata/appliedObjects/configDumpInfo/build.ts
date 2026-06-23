import { randomBytes, randomUUID } from "crypto"
import type { StructuralState } from "../configuration/migrations/types"
import { configDumpInfoNameFromMigrationPath, isManagedConfigDumpInfoRootSegment } from "./nameMapping"
import type { ConfigDumpInfo } from "./types"

export type ConfigDumpInfoGenerators = {
  id: () => string
  configVersion: () => string
}

const defaultGenerators: ConfigDumpInfoGenerators = {
  id: () => randomUUID(),
  configVersion: () => randomBytes(20).toString("hex"),
}

const MANAGED_CHILD_SEGMENTS = new Set(["Attribute", "AddressingAttribute", "TabularSection", "Dimension", "Resource"])

export function buildConfigDumpInfo(params: {
  reference: ConfigDumpInfo
  yamlState: StructuralState
  migrationState: StructuralState
  referencePathByCurrentPath: Map<string, string>
  generators?: Partial<ConfigDumpInfoGenerators>
}): ConfigDumpInfo {
  const generators = { ...defaultGenerators, ...params.generators }
  const entries: ConfigDumpInfo = new Map()
  const objectMappings = collectObjectMappings(params)
  const childMappings: Array<{
    ownerCurrentDumpName: string
    currentDumpName: string
    referenceDumpName?: string
  }> = []

  for (const mapping of objectMappings) {
    const referenceEntry = mapping.referenceDumpName ? params.reference.get(mapping.referenceDumpName) : undefined
    entries.set(mapping.currentDumpName, {
      id: referenceEntry?.id ?? generators.id(),
      configVersion: referenceEntry?.configVersion ?? generators.configVersion(),
      children: new Map(),
    })
  }

  for (const [path] of params.yamlState.nodes) {
    if (isObjectPath(path)) continue

    const ownerPath = getOwnerPath(path)
    const ownerMapping = objectMappings.find((mapping) => mapping.currentPath === ownerPath)
    if (!ownerMapping) continue

    const currentDumpName = configDumpInfoNameFromMigrationPath(path)
    const referencePath = resolveReferencePath(params, path)
    const referenceDumpName = referencePath ? configDumpInfoNameFromMigrationPath(referencePath) : undefined
    const referenceChildId =
      ownerMapping.referenceDumpName && referenceDumpName
        ? params.reference.get(ownerMapping.referenceDumpName)?.children.get(referenceDumpName)
        : undefined

    entries.get(ownerMapping.currentDumpName)?.children.set(currentDumpName, referenceChildId ?? generators.id())
    childMappings.push({
      ownerCurrentDumpName: ownerMapping.currentDumpName,
      currentDumpName,
      referenceDumpName,
    })
  }

  orderObjectChildren({ reference: params.reference, entries, objectMappings, childMappings })
  preserveExternalReferenceEntries({ ...params, entries, objectMappings })

  return orderEntries({ reference: params.reference, entries, objectMappings })
}

function collectObjectMappings(params: {
  reference: ConfigDumpInfo
  yamlState: StructuralState
  migrationState: StructuralState
  referencePathByCurrentPath: Map<string, string>
}): Array<{ currentPath: string; currentDumpName: string; referenceDumpName?: string }> {
  return [...params.yamlState.nodes.keys()].filter(isObjectPath).map((currentPath) => {
    const currentDumpName = configDumpInfoNameFromMigrationPath(currentPath)
    const referencePath = resolveReferencePath(params, currentPath)
    const referenceDumpName = referencePath ? configDumpInfoNameFromMigrationPath(referencePath) : undefined

    return { currentPath, currentDumpName, referenceDumpName }
  })
}

function resolveReferencePath(
  params: {
    reference: ConfigDumpInfo
    migrationState: StructuralState
    referencePathByCurrentPath: Map<string, string>
  },
  currentPath: string,
): string | undefined {
  const migratedNode = params.migrationState.nodes.get(currentPath)
  if (migratedNode && migratedNode.referencePath === undefined) return undefined

  const remapped = params.referencePathByCurrentPath.get(currentPath)
  if (remapped) return remapped

  const currentDumpName = configDumpInfoNameFromMigrationPath(currentPath)
  return hasReferenceEntry(params.reference, currentDumpName) ? currentPath : undefined
}

function hasReferenceEntry(reference: ConfigDumpInfo, dumpName: string): boolean {
  if (reference.has(dumpName)) return true

  for (const value of reference.values()) {
    if (value.children.has(dumpName)) return true
  }

  return false
}

function preserveExternalReferenceEntries(params: {
  reference: ConfigDumpInfo
  entries: ConfigDumpInfo
  objectMappings: Array<{ currentDumpName: string; referenceDumpName?: string }>
}): void {
  for (const [referenceName, entry] of params.reference) {
    for (const mapping of params.objectMappings) {
      if (!mapping.referenceDumpName) continue
      if (!referenceName.startsWith(`${mapping.referenceDumpName}.`)) continue

      const currentName = `${mapping.currentDumpName}${referenceName.slice(mapping.referenceDumpName.length)}`
      if (params.entries.has(currentName)) continue

      params.entries.set(currentName, {
        id: entry.id,
        configVersion: entry.configVersion,
        children: remapExternalChildren(entry.children, mapping),
      })
    }
  }
}

function remapExternalChildren(
  children: Map<string, string>,
  mapping: { currentDumpName: string; referenceDumpName?: string },
): Map<string, string> {
  if (!mapping.referenceDumpName) return new Map(children)

  const referencePrefix = `${mapping.referenceDumpName}.`
  return new Map(
    [...children].map(([childName, id]) => [
      childName.startsWith(referencePrefix)
        ? `${mapping.currentDumpName}${childName.slice(referencePrefix.length - 1)}`
        : childName,
      id,
    ]),
  )
}

function orderObjectChildren(params: {
  reference: ConfigDumpInfo
  entries: ConfigDumpInfo
  objectMappings: Array<{ currentDumpName: string; referenceDumpName?: string }>
  childMappings: Array<{ ownerCurrentDumpName: string; currentDumpName: string; referenceDumpName?: string }>
}): void {
  const childByReferenceByOwner = new Map<string, Map<string, string>>()
  for (const child of params.childMappings) {
    if (!child.referenceDumpName) continue
    const ownerChildren = childByReferenceByOwner.get(child.ownerCurrentDumpName) ?? new Map<string, string>()
    ownerChildren.set(child.referenceDumpName, child.currentDumpName)
    childByReferenceByOwner.set(child.ownerCurrentDumpName, ownerChildren)
  }

  for (const mapping of params.objectMappings) {
    if (!mapping.referenceDumpName) continue
    const entry = params.entries.get(mapping.currentDumpName)
    const referenceEntry = params.reference.get(mapping.referenceDumpName)
    if (!entry || !referenceEntry) continue

    const childrenByReference = childByReferenceByOwner.get(mapping.currentDumpName)
    const orderedChildren = new Map<string, string>()
    for (const referenceChildName of referenceEntry.children.keys()) {
      const currentChildName = childrenByReference?.get(referenceChildName)
      if (currentChildName) {
        const id = entry.children.get(currentChildName)
        if (id) orderedChildren.set(currentChildName, id)
        continue
      }

      if (!isManagedReferenceChild(referenceChildName, mapping.referenceDumpName)) {
        orderedChildren.set(remapReferenceChildName(referenceChildName, mapping), referenceEntry.children.get(referenceChildName)!)
      }
    }
    for (const [childName, id] of entry.children) {
      if (!orderedChildren.has(childName)) orderedChildren.set(childName, id)
    }
    entry.children = orderedChildren
  }
}

function isManagedReferenceChild(childName: string, referenceOwnerName: string): boolean {
  const childSegment = childName.slice(`${referenceOwnerName}.`.length).split(".")[0]
  return MANAGED_CHILD_SEGMENTS.has(childSegment ?? "")
}

function remapReferenceChildName(
  childName: string,
  mapping: { currentDumpName: string; referenceDumpName?: string },
): string {
  if (!mapping.referenceDumpName) return childName
  return childName.startsWith(`${mapping.referenceDumpName}.`)
    ? `${mapping.currentDumpName}${childName.slice(mapping.referenceDumpName.length)}`
    : childName
}

function orderEntries(params: {
  reference: ConfigDumpInfo
  entries: ConfigDumpInfo
  objectMappings: Array<{ currentDumpName: string; referenceDumpName?: string }>
}): ConfigDumpInfo {
  const result: ConfigDumpInfo = new Map()
  const emitted = new Set<string>()
  const ownerByReference = new Map(
    params.objectMappings.flatMap((mapping) =>
      mapping.referenceDumpName ? [[mapping.referenceDumpName, mapping.currentDumpName] as const] : [],
    ),
  )

  for (const referenceName of params.reference.keys()) {
    const currentName = remapReferenceEntryName(referenceName, ownerByReference)
    if (!currentName && !shouldPreserveUnmanagedReferenceEntry(referenceName)) continue
    const targetName = currentName ?? referenceName
    const entry = params.entries.get(targetName) ?? params.reference.get(referenceName)
    if (!entry) continue
    result.set(targetName, entry)
    emitted.add(targetName)
  }

  for (const [name, entry] of params.entries) {
    if (!emitted.has(name)) result.set(name, entry)
  }

  return result
}

function shouldPreserveUnmanagedReferenceEntry(referenceName: string): boolean {
  const rootSegment = referenceName.split(".")[0]
  return rootSegment !== undefined && !isManagedConfigDumpInfoRootSegment(rootSegment)
}

function remapReferenceEntryName(
  referenceName: string,
  ownerByReference: Map<string, string>,
): string | undefined {
  const referenceOwnerName = getOwnerDumpName(referenceName)
  const currentOwnerName = referenceOwnerName ? ownerByReference.get(referenceOwnerName) : undefined
  if (!referenceOwnerName || !currentOwnerName) return undefined
  if (referenceName === referenceOwnerName) return currentOwnerName
  return `${currentOwnerName}${referenceName.slice(referenceOwnerName.length)}`
}

function getOwnerDumpName(name: string): string | undefined {
  const parts = name.split(".")
  if (parts.length < 2) return undefined
  return parts.slice(0, 2).join(".")
}

function getOwnerPath(path: string): string {
  return path.split(".").slice(0, 2).join(".")
}

function isObjectPath(path: string): boolean {
  return path.split(".").length === 2
}
