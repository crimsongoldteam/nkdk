import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataObjectStringToYAML } from "../metadataPath/toYAML"
import { MetadataObjectRefCollection, MetadataObjectRefCollectionYAML } from "./types"

const metadataObjectRefCollectionTargetRule = {
  type: "MetadataItemLink",
  metadataTarget: { kind: "object" },
} as const satisfies PropertyRule

export const exportMetadataObjectRefCollectionToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataObjectRefCollection | undefined
): MetadataObjectRefCollectionYAML | undefined => {
  if (!data || data.length === 0) return undefined

  const objectRule: PropertyRule = {
    ...metadataObjectRefCollectionTargetRule,
    metadataTarget: rule?.metadataTarget ?? metadataObjectRefCollectionTargetRule.metadataTarget,
  }

  return data.map((item) => exportMetadataObjectStringToYAML(context, objectRule, item)!)
}

registerTypeRule("MetadataObjectRefCollection", "exportToYAML", exportMetadataObjectRefCollectionToYAML)
