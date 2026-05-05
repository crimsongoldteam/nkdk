import { ExportToXMLFunctionNew, registerTypeRule } from "~/metadata/orchestration"
import { getUUID } from "../../helpers/uuid"

export const exportUUIDToXML: ExportToXMLFunctionNew = (params): string => {
  const { context, value, referenceMetadata } = params
  const uuid = (value as string | undefined) ?? (referenceMetadata as string | undefined)
  return uuid ?? getUUID(context)
}

registerTypeRule("uuid", "exportToXML", exportUUIDToXML)
