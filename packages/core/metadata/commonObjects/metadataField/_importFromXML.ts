import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { MetadataField, MetadataFields, MetadataFieldsXML, MetadataFieldXML } from "./types"

export const _importMetadataFieldFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFieldXML | string | undefined
): MetadataField | undefined => {
  if (!data) return undefined

  if (typeof data === "string") return data

  return data["#text"]
}

export const _importMetadataFieldsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFieldsXML | undefined
): MetadataFields | undefined => {
  if (!data) return undefined

  const fields = data["xr:Field"]

  const items = Array.isArray(fields) ? fields : [fields]

  const result = items.map((value) => _importMetadataFieldFromXML(context, _rule, value)!)

  return result
}
