import { ConfigurationContext } from "~/metadata/context/types"
import { FieldsList, FieldsListXML } from "./types"

export const importFieldsListFromXML = (
  _context: ConfigurationContext,
  xml: FieldsListXML | undefined
): FieldsList | undefined => {
  if (!xml || !xml.Field) return undefined

  return Array.isArray(xml.Field) ? xml.Field : [xml.Field]
}
