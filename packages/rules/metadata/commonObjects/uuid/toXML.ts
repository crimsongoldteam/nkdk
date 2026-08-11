import { recordCurrentExternalMetadataUuid } from "../../ruleRuntime/externalMetadata/record"
import { ExportToXMLFunctionNew, definePropertyTypeRule } from "../../ruleRuntime"
import { getUUID } from "../../helpers/uuid"

export const exportUUIDToXML: ExportToXMLFunctionNew = (params): string => {
  const { context, value, referenceMetadata } = params
  const uuid = (value as string | undefined) ?? (referenceMetadata as string | undefined) ?? getUUID(context)
  recordCurrentExternalMetadataUuid({ context, uuid })
  return uuid
}

export const metadataPropertyRule000 = definePropertyTypeRule("uuid", "exportToXML", exportUUIDToXML)
