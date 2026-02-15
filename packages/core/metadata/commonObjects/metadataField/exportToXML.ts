import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { ConfigurationContext } from "../../context/types"
import { MetadataField, MetadataFields, MetadataFieldsXML } from "./types"

export const exportMetadataFieldToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataField | undefined
): string | undefined => {
  if (!data) return undefined

  return String(data)
}

export const exportMetadataFieldsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataFields | undefined
): MetadataFieldsXML | undefined => {
  if (!data) return undefined

  const items = Array.isArray(data) ? data : [data]

  return {
    "xr:Field": items.map((value) => exportMetadataFieldToXML(context, undefined, value)!),
  }
}

registerTypeRule("MetadataField", "exportToXML", exportMetadataFieldToXML)
