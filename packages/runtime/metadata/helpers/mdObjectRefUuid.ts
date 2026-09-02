import type { ConfigurationContext } from "../context/types"

export const MD_OBJECT_REF_UUID_SOURCE =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"

const MD_OBJECT_REF_UUID = new RegExp(`^${MD_OBJECT_REF_UUID_SOURCE}$`)

export const METADATA_TARGET_UUID_SOURCE =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

const METADATA_TARGET_UUID = new RegExp(
  `^(?:${METADATA_TARGET_UUID_SOURCE})(?:\\.${METADATA_TARGET_UUID_SOURCE})?$`,
  "iu",
)

export function isMDObjectRefUuid(value: string): boolean {
  return MD_OBJECT_REF_UUID.test(value)
}

export function isMetadataTargetUuid(value: string): boolean {
  return METADATA_TARGET_UUID.test(value)
}

export function isXmlImportControlExportContext(context: ConfigurationContext): boolean {
  if (context.exportToXML === undefined || !("fromXML" in context)) return false
  const fromXML = context.fromXML
  return typeof fromXML === "object"
    && fromXML !== null
    && "componentKind" in fromXML
    && typeof fromXML.componentKind === "string"
}
