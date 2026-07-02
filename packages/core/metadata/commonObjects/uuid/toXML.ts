import { recordCurrentExternalMetadataUuid } from "../../orchestration/externalMetadata/record"
import { ExportToXMLFunctionNew, registerTypeRule } from "../../orchestration"
import { getUUID } from "../../helpers/uuid"

export const exportUUIDToXML: ExportToXMLFunctionNew = (params): string => {
  const { context, value, referenceMetadata } = params
  const uuid = (value as string | undefined) ?? (referenceMetadata as string | undefined) ?? getUUID(context)
  recordCurrentExternalMetadataUuid({ context, uuid })
  return uuid
}

registerTypeRule("uuid", "exportToXML", exportUUIDToXML)
