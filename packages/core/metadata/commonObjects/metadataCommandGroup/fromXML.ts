import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
import { ConfigurationContext } from "@nkdk/runtime"
import { MetadataCommandGroup, MetadataCommandGroupXML } from "./types"

export const importMetadataCommandGroupFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataCommandGroupXML | string | undefined
): MetadataCommandGroup | undefined => {
  if (data === undefined) return undefined

  if (typeof data === "string") return data

  return data["#text"]
}

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataCommandGroup", "importFromXML", importMetadataCommandGroupFromXML)
