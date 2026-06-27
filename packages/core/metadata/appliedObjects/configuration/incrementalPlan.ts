import {
  resolveXmlSyncAreaForProjectPath,
  type XmlSyncArea,
} from "~/metadata/orchestration/appliedObject/xmlAreas"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { XmlSyncStateDiff } from "./syncState"

export interface PlannedXmlSyncArea {
  key: string
  area: XmlSyncArea
  changedPaths: string[]
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
  const changedPaths = [...params.diff.added, ...params.diff.changed, ...params.diff.deleted]

  for (const path of changedPaths) {
    const area = resolveXmlSyncAreaForProjectPath(path, params.rules)
    if (!area) throw new Error(`Нет правила инкрементальной XML-синхронизации для "${path}"`)

    const key = areaKey(area)
    const existing = grouped.get(key)
    if (existing) existing.changedPaths.push(path)
    else grouped.set(key, { key, area, changedPaths: [path] })
  }

  const areas = [...grouped.values()].sort((left, right) => left.key.localeCompare(right.key, "ru"))
  return {
    areas,
    rebuildConfigurationXml: areas.some((item) => item.area.kind === "owner" || item.area.ownerCompositionChanges),
  }
}

export function areaKey(area: XmlSyncArea): string {
  if (area.kind === "owner") return `owner:${area.itemTypePrefix}/${area.itemName}`
  if (area.kind === "fileItem") {
    return `fileItem:${area.itemTypePrefix}/${area.itemName}/${area.childKind}/${area.childName}`
  }
  return `externalFile:${area.xmlPath}`
}
