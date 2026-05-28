import { randomBytes } from "crypto"
import { v4 } from "uuid"
import type { StructuralState } from "../configuration/migrations/types"
import { configDumpInfoNameFromMigrationPath } from "./nameMapping"
import type { ConfigDumpInfo } from "./types"

export type ConfigDumpInfoGenerators = {
  id: () => string
  configVersion: () => string
}

const defaultGenerators: ConfigDumpInfoGenerators = {
  id: () => v4(),
  configVersion: () => randomBytes(20).toString("hex"),
}

export function buildConfigDumpInfo(params: {
  reference: ConfigDumpInfo
  yamlState: StructuralState
  migrationState: StructuralState
  referencePathByCurrentPath: Map<string, string>
  generators?: Partial<ConfigDumpInfoGenerators>
}): ConfigDumpInfo {
  const generators = { ...defaultGenerators, ...params.generators }
  const result: ConfigDumpInfo = new Map()
  const objectMappings = collectObjectMappings(params)

  for (const mapping of objectMappings) {
    const referenceEntry = mapping.referenceDumpName ? params.reference.get(mapping.referenceDumpName) : undefined
    result.set(mapping.currentDumpName, {
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

    result.get(ownerMapping.currentDumpName)?.children.set(currentDumpName, referenceChildId ?? generators.id())
  }

  preserveExternalReferenceEntries({ ...params, result, objectMappings })

  return result
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
  result: ConfigDumpInfo
  objectMappings: Array<{ currentDumpName: string; referenceDumpName?: string }>
}): void {
  for (const [referenceName, entry] of params.reference) {
    for (const mapping of params.objectMappings) {
      if (!mapping.referenceDumpName) continue
      if (!referenceName.startsWith(`${mapping.referenceDumpName}.`)) continue

      const currentName = `${mapping.currentDumpName}${referenceName.slice(mapping.referenceDumpName.length)}`
      if (params.result.has(currentName)) continue

      params.result.set(currentName, {
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
        ? `${mapping.currentDumpName}${childName.slice(mapping.referenceDumpName.length)}`
        : childName,
      id,
    ]),
  )
}

function getOwnerPath(path: string): string {
  return path.split(".").slice(0, 2).join(".")
}

function isObjectPath(path: string): boolean {
  return path.split(".").length === 2
}
