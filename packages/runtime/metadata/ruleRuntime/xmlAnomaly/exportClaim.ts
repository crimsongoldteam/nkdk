const XML_ANOMALY_EXPORT_CLAIM = Symbol.for("@nkdk/runtime/xmlAnomalyExportClaim")
const XML_ANOMALY_RAW_ITEM = Symbol.for("@nkdk/runtime/xmlAnomalyRawItem")
const XML_ANOMALY_RAW_COLLECTION_ITEMS = Symbol.for("@nkdk/runtime/xmlAnomalyRawCollectionItems")

export const XML_ANOMALY_RAW_ITEM_PLACEHOLDER = "nkdkXmlAnomalyRawItem"

export function markXmlAnomalyExportClaim(
  value: unknown,
  claimId: string,
  enumerable = false,
): void {
  if (!isRecord(value)) {
    throw new Error(`XML anomaly export claim ${claimId} можно назначить только объекту`)
  }
  const existing = value[XML_ANOMALY_EXPORT_CLAIM]
  if (existing !== undefined && existing !== claimId) {
    throw new Error(`XML anomaly export claim ${claimId} пересекается с ${String(existing)}`)
  }
  Object.defineProperty(value, XML_ANOMALY_EXPORT_CLAIM, {
    configurable: true,
    enumerable,
    value: claimId,
  })
}

export function copyXmlAnomalyExportClaim(source: unknown, target: unknown): void {
  const claimId = readXmlAnomalyExportClaim(source)
  if (claimId !== undefined) markXmlAnomalyExportClaim(target, claimId)
}

export function readXmlAnomalyExportClaim(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined
  const claimId = value[XML_ANOMALY_EXPORT_CLAIM]
  return typeof claimId === "string" ? claimId : undefined
}

export function markXmlAnomalyRawItem(value: unknown, claimId: string): void {
  if (!isRecord(value)) {
    throw new Error(`XML anomaly raw item ${claimId} можно назначить только объекту`)
  }
  Object.defineProperty(value, XML_ANOMALY_RAW_ITEM, {
    configurable: true,
    enumerable: false,
    value: claimId,
  })
}

export function readXmlAnomalyRawItem(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined
  const claimId = value[XML_ANOMALY_RAW_ITEM]
  return typeof claimId === "string" ? claimId : undefined
}

export interface XmlAnomalyRawCollectionItem {
  readonly index: number
  readonly yaml: object
  readonly name?: string
}

export function appendXmlAnomalyRawCollectionItem(
  collection: unknown,
  item: XmlAnomalyRawCollectionItem,
): void {
  if (collection === null || typeof collection !== "object") {
    throw new Error("XML anomaly raw item можно назначить только коллекции")
  }
  const current = readXmlAnomalyRawCollectionItems(collection)
  Object.defineProperty(collection, XML_ANOMALY_RAW_COLLECTION_ITEMS, {
    configurable: true,
    enumerable: true,
    value: [...current, item],
  })
}

export function readXmlAnomalyRawCollectionItems(
  collection: unknown,
): readonly XmlAnomalyRawCollectionItem[] {
  if (collection === null || typeof collection !== "object") return []
  const value = (collection as Record<PropertyKey, unknown>)[XML_ANOMALY_RAW_COLLECTION_ITEMS]
  return Array.isArray(value) ? value as readonly XmlAnomalyRawCollectionItem[] : []
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
