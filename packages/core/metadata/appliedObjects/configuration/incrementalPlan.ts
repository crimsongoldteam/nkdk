import { resolveXmlSyncAreaForProjectPath, type XmlSyncArea } from "../../orchestration/appliedObject/xmlAreas"
import type { XmlSyncStateDiff } from "./syncState"
import type { CompiledMetadataResourceTopology } from "../../resourceTopology/types"
import { compileRegisteredMetadataResourceTopology } from "../../resourceTopology/registry"
import { resolveMetadataProjectChangeImpact } from "../../resourceTopology/xmlExportProjection"

export interface PlannedXmlSyncArea {
  key: string
  area: XmlSyncArea
  changedPaths: string[]
  changesConfigurationComposition: boolean
  fromMigration: boolean
}

export interface IncrementalXmlSyncPlan {
  areas: PlannedXmlSyncArea[]
  rebuildConfigurationXml: boolean
}

export function buildIncrementalXmlSyncPlan(params: {
  diff: XmlSyncStateDiff
  topology?: CompiledMetadataResourceTopology
  extraAreas?: readonly XmlSyncArea[]
}): IncrementalXmlSyncPlan {
  const topology = params.topology ?? compileRegisteredMetadataResourceTopology()
  const grouped = new Map<string, PlannedXmlSyncArea>()

  for (const path of params.diff.added) {
    addPathToPlan({ grouped, path, topology, changesConfigurationComposition: true })
  }
  for (const path of params.diff.changed) {
    addPathToPlan({ grouped, path, topology, changesConfigurationComposition: false })
  }
  for (const path of params.diff.deleted) {
    addPathToPlan({ grouped, path, topology, changesConfigurationComposition: true })
  }
  for (const area of params.extraAreas ?? []) {
    addAreaToPlan({
      grouped,
      area,
      changedPath: "Миграции",
      changesConfigurationComposition: true,
      fromMigration: true,
    })
  }

  const areas = [...grouped.values()].sort((left, right) => left.key.localeCompare(right.key, "ru"))
  return {
    areas,
    rebuildConfigurationXml: areas.some((item) => item.changesConfigurationComposition),
  }
}

function addPathToPlan(params: {
  grouped: Map<string, PlannedXmlSyncArea>
  path: string
  topology: CompiledMetadataResourceTopology
  changesConfigurationComposition: boolean
}): void {
  const impact = resolveMetadataProjectChangeImpact(params.topology, params.path)
  const area = resolveXmlSyncAreaForProjectPath(params.path, params.topology)
  if (!area) throw new Error(`Нет правила инкрементальной XML-синхронизации для "${params.path}"`)

  const key = areaKey(area)
  const existing = params.grouped.get(key)
  const changesConfigurationComposition =
    params.changesConfigurationComposition && impact?.compositionImpact === "configurationComposition"
  if (existing) {
    existing.changedPaths.push(params.path)
    existing.changesConfigurationComposition ||= changesConfigurationComposition
    return
  }
  params.grouped.set(key, {
    key,
    area,
    changedPaths: [params.path],
    changesConfigurationComposition,
    fromMigration: false,
  })
}

function addAreaToPlan(params: {
  grouped: Map<string, PlannedXmlSyncArea>
  area: XmlSyncArea
  changedPath: string
  changesConfigurationComposition: boolean
  fromMigration: boolean
}): void {
  const key = areaKey(params.area)
  const existing = params.grouped.get(key)
  if (existing) {
    existing.changedPaths.push(params.changedPath)
    existing.changesConfigurationComposition ||= params.changesConfigurationComposition
    existing.fromMigration ||= params.fromMigration
    return
  }
  params.grouped.set(key, {
    key,
    area: params.area,
    changedPaths: [params.changedPath],
    changesConfigurationComposition: params.changesConfigurationComposition,
    fromMigration: params.fromMigration,
  })
}

export function areaKey(area: XmlSyncArea): string {
  if (area.kind === "owner") return `owner:${area.itemTypePrefix}/${area.itemName}`
  if (area.kind === "fileItem") {
    return `fileItem:${area.itemTypePrefix}/${area.itemName}/${area.propertyName}/${routeParamsKey(area.routeParams)}`
  }
  return `externalFile:${area.xmlPath}`
}

function routeParamsKey(params: Record<string, string>): string {
  if (typeof params.itemName === "string") return params.itemName
  return Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right, "ru"))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")
}
