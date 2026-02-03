import { ConfigurationContext } from "~/metadata/context/types"
import { FieldsList, FieldsListXML } from "./types"

export const exportFieldsListToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FieldsList | undefined
): FieldsListXML | undefined => {
  if (!data || data.length === 0) return undefined

  return {
    Field: data,
  }
}
