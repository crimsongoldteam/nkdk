const XML_ANOMALY_EXPORT_CLAIM = Symbol("xmlAnomalyExportClaim")

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

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
