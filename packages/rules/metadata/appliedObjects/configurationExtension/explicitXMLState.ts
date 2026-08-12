import { xmlScalarTagPayload } from "@nkdk/runtime"

export const CONFIGURATION_EXTENSION_PROPERTY_STATE_XML_CARRIER = "configurationExtensionPropertyStateXML:"

export interface ExplicitXMLPropertyStatePayload {
  readonly version: 1
  readonly itemType: string
  readonly propertyKey: string
  readonly propertyXML: unknown
  readonly propertyStateXML: { readonly "xr:Property": string; readonly "xr:State": string }
}

export function encodeExplicitXMLPropertyState(
  payload: Omit<ExplicitXMLPropertyStatePayload, "version">,
): string {
  return `!xml ${CONFIGURATION_EXTENSION_PROPERTY_STATE_XML_CARRIER}${Buffer.from(JSON.stringify({ version: 1, ...payload }), "utf8").toString("base64url")}`
}

export function isExplicitXMLPropertyState(yamlValue: string): boolean {
  return xmlScalarTagPayload(yamlValue).startsWith(CONFIGURATION_EXTENSION_PROPERTY_STATE_XML_CARRIER)
}

export function decodeExplicitXMLPropertyState(
  yamlValue: string,
  expected: { readonly itemType: string; readonly propertyKey: string },
): ExplicitXMLPropertyStatePayload {
  const scalar = xmlScalarTagPayload(yamlValue)
  if (!scalar.startsWith(CONFIGURATION_EXTENSION_PROPERTY_STATE_XML_CARRIER)) throw new Error("Неизвестный переносчик PropertyState")
  let parsed: Partial<ExplicitXMLPropertyStatePayload>
  try {
    parsed = JSON.parse(Buffer.from(scalar.slice(CONFIGURATION_EXTENSION_PROPERTY_STATE_XML_CARRIER.length), "base64url").toString("utf8"))
  } catch {
    throw new Error("Повреждён payload PropertyState")
  }
  if (parsed.version !== 1) throw new Error(`Неподдерживаемая версия payload PropertyState: ${String(parsed.version)}`)
  if (parsed.itemType !== expected.itemType || parsed.propertyKey !== expected.propertyKey) {
    throw new Error("Переносчик PropertyState не соответствует свойству")
  }
  const state = parsed.propertyStateXML
  if (
    typeof state !== "object" || state === null ||
    typeof state["xr:Property"] !== "string" || typeof state["xr:State"] !== "string"
  ) throw new Error("Повреждён PropertyState в payload")
  return parsed as ExplicitXMLPropertyStatePayload
}
