import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
import { ConfigurationContext, isXmlElementNode, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { MetadataCommandGroup, MetadataCommandGroupXML } from "./types"

export const importMetadataCommandGroupFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataCommandGroupXML | string | XmlElementNode | undefined
): MetadataCommandGroup | undefined => {
  if (data === undefined) return undefined
  if (isXmlElementNode(data)) return xmlTextValue(data) || undefined

  if (typeof data === "string") return data

  return data["#text"]
}

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataCommandGroup", "importFromXML", importMetadataCommandGroupFromXML)
