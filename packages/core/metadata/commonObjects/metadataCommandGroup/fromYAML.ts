import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
import { importSystemEnumerationFromYAMLDeprecated } from "../../systemEnumerations/fromYAML"
import * as SE from "../../systemEnumerations/types"
import { ConfigurationContext } from "../../context/types"
import { importMetadataItemLinkFromYAML } from "../metadataRef/fromYAML"
import { MetadataCommandGroup, MetadataCommandGroupYAML } from "./types"

export const importMetadataCommandGroupFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataCommandGroupYAML | undefined
): MetadataCommandGroup | undefined => {
  if (!data) return undefined

  if (typeof data !== "string") return undefined

  if (data in SE.StandardCommandsGroupFromYAML) {
    return importSystemEnumerationFromYAMLDeprecated<SE.StandardCommandsGroup>(
      context,
      { type: "SystemEnumeration", typeSE: "StandardCommandsGroup" },
      data
    )!
  }

  return importMetadataItemLinkFromYAML(context, undefined, data)!
}

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataCommandGroup", "importFromYAML", importMetadataCommandGroupFromYAML)
