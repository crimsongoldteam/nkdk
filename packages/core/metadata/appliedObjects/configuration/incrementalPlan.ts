import { resolveXmlSyncAreaForProjectPath, type XmlSyncArea } from "~/metadata/orchestration/appliedObject/xmlAreas"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { XmlSyncStateDiff } from "./syncState"

export interface PlannedXmlSyncArea {
  key: string
  area: XmlSyncArea
  changedPaths: string[]
  changesConfigurationComposition: boolean
}

export interface IncrementalXmlSyncPlan {
  areas: PlannedXmlSyncArea[]
  rebuildConfigurationXml: boolean
}

export function buildIncrementalXmlSyncPlan(params: {
  diff: XmlSyncStateDiff
  rules: readonly MetadataItemRule[]
}): IncrementalXmlSyncPlan {
  const grouped = new Map<string, PlannedXmlSyncArea>()

  for (const path of params.diff.added) {
    addPathToPlan({ grouped, path, rules: params.rules, changesConfigurationComposition: true })
  }
  for (const path of params.diff.changed) {
    addPathToPlan({ grouped, path, rules: params.rules, changesConfigurationComposition: false })
  }
  for (const path of params.diff.deleted) {
    addPathToPlan({ grouped, path, rules: params.rules, changesConfigurationComposition: true })
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
  rules: readonly MetadataItemRule[]
  changesConfigurationComposition: boolean
}): void {
  const area = resolveXmlSyncAreaForProjectPath(params.path, params.rules)
  if (!area) throw new Error(`Нет правила инкрементальной XML-синхронизации для "${params.path}"`)

  const key = areaKey(area)
  const existing = params.grouped.get(key)
  const changesConfigurationComposition =
    params.changesConfigurationComposition &&
    (area.kind === "owner" || (area.kind === "fileItem" && area.ownerCompositionChanges))
  if (existing) {
    existing.changedPaths.push(params.path)
    existing.changesConfigurationComposition ||= changesConfigurationComposition
    return
  }
  params.grouped.set(key, { key, area, changedPaths: [params.path], changesConfigurationComposition })
}

export function areaKey(area: XmlSyncArea): string {
  if (area.kind === "owner") return `owner:${area.itemTypePrefix}/${area.itemName}`
  if (area.kind === "fileItem") {
    return `fileItem:${area.itemTypePrefix}/${area.itemName}/${area.childKind}/${area.childName}`
  }
  return `externalFile:${area.xmlPath}`
}
