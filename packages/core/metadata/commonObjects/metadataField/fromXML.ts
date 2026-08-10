import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import type { MetadataField, MetadataFields, MetadataFieldsXML, MetadataFieldXML } from "./types"

export const importMetadataFieldFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFieldXML | string | undefined
): MetadataField | undefined => {
  if (!data) return undefined

  if (typeof data === "string") return data

  return data["#text"]
}

export const importMetadataFieldsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: MetadataFieldsXML | undefined
): MetadataFields | undefined => {
  if (!data) return undefined

  const fields = data["xr:Field"]

  const items = Array.isArray(fields) ? fields : [fields]

  const result = items.map((value) => importMetadataFieldFromXML(context, undefined, value)!)

  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataField", "importFromXML", importMetadataFieldsFromXML)
export const metadataPropertyRule001 = definePropertyTypeRule("MetadataFields", "importFromXML", importMetadataFieldsFromXML)
