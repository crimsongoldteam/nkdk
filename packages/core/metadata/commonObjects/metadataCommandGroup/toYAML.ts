import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { exportSystemEnumerationToYAMLDeprecated } from "~/metadata/systemEnumerations/toYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataItemLinkToYAML } from "../metadataRef/toYAML"
import { MetadataCommandGroup, MetadataCommandGroupYAML } from "./types"

export const exportMetadataCommandGroupToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataCommandGroup | undefined
): MetadataCommandGroupYAML | undefined => {
  if (!data) return undefined

  if (typeof data === "string" && data in SE.StandardCommandsGroupToYAML) {
    return exportSystemEnumerationToYAMLDeprecated<SE.StandardCommandsGroupYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "StandardCommandsGroup" },
      data
    )!
  }

  return exportMetadataItemLinkToYAML(context, undefined, data)
}

registerTypeRule("MetadataCommandGroup", "exportToYAML", exportMetadataCommandGroupToYAML)
