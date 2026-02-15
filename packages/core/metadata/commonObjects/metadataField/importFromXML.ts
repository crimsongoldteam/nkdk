import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { ConfigurationContext } from "../../context/types"
import { MetadataField, MetadataFields, MetadataFieldsXML, MetadataFieldXML } from "./types"

export const importMetadataFieldFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataFieldXML | string | undefined
): MetadataField | undefined => {
  if (!data) return undefined

  if (typeof data === "string") return data

  return data["#text"]
}

export const importMetadataFieldsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataFieldsXML | undefined
): MetadataFields | undefined => {
  if (!data) return undefined

  const fields = data["xr:Field"]

  const items = Array.isArray(fields) ? fields : [fields]

  const result = items.map((value) => importMetadataFieldFromXML(context, undefined, value)!)

  return result
}

registerTypeRule("MetadataField", "importFromXML", importMetadataFieldFromXML)
