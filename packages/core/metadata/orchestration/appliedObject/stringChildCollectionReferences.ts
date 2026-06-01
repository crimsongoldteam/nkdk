import type { MetadataItemRule } from "~/metadata/orchestration/property/types"

export function omitStringChildCollectionReferencesFromXML(xml: unknown, rule: MetadataItemRule): unknown {
  if (!xml || typeof xml !== "object") return xml
  const container = getXMLRootContainer(rule)
  if (!container) return xml
  const root = (xml as Record<string, unknown>)[container]
  if (!root || typeof root !== "object") return xml

  let nextRoot: Record<string, unknown> | undefined
  for (const childCollection of rule.childCollections ?? []) {
    if (!childCollection.fileItemRule || !childCollection.xmlDir) continue
    const propertyRule = rule.properties[childCollection.propertyKey]
    if (!propertyRule) continue

    const xmlKey = propertyRule.xml ?? childCollection.propertyKey
    const xmlPath = [...(propertyRule.xmlParents ?? []), xmlKey]
    const currentRoot = nextRoot ?? (root as Record<string, unknown>)
    const xmlValue = readXMLPath(currentRoot, xmlPath)
    if (
      typeof xmlValue !== "string" &&
      (!Array.isArray(xmlValue) || !xmlValue.some((item) => typeof item === "string"))
    ) {
      continue
    }

    const objectReferences = Array.isArray(xmlValue) ? xmlValue.filter((item) => typeof item !== "string") : undefined
    nextRoot = writeXMLPath(currentRoot, xmlPath, objectReferences)
  }

  return nextRoot ? { ...(xml as Record<string, unknown>), [container]: nextRoot } : xml
}

function getXMLRootContainer(rule: MetadataItemRule): string | undefined {
  const xmlRootEntry = Object.entries(rule.properties).find(([, propertyRule]) => propertyRule.type === "XMLRoot")
  return xmlRootEntry ? (xmlRootEntry[1] as { container?: string }).container : undefined
}

function readXMLPath(xml: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = xml
  for (const part of path) {
    if (!current || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function writeXMLPath(root: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  const nextRoot = { ...root }
  let current = nextRoot
  for (const part of path.slice(0, -1)) {
    const next = current[part]
    if (!next || typeof next !== "object" || Array.isArray(next)) return nextRoot
    const nextCopy = { ...(next as Record<string, unknown>) }
    current[part] = nextCopy
    current = nextCopy
  }

  const key = path[path.length - 1]
  if (value === undefined) {
    delete current[key]
  } else {
    current[key] = value
  }
  return nextRoot
}
