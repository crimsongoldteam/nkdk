import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { importMetadataObjectStringFromYAML } from "../metadataPath/fromYAML"
import type { MetadataObjectRefCollection, MetadataObjectRefCollectionYAML } from "./types"

const metadataObjectRefCollectionTargetRule = {
  type: "MetadataItemLink",
  metadataTarget: { kind: "object" },
} as const satisfies PropertyRule

export const importMetadataObjectRefCollectionFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataObjectRefCollectionYAML | undefined
): MetadataObjectRefCollection | undefined => {
  if (!data || data.length === 0) return undefined

  const objectRule: PropertyRule = {
    ...metadataObjectRefCollectionTargetRule,
    metadataTarget: rule?.metadataTarget ?? metadataObjectRefCollectionTargetRule.metadataTarget,
  }

  return data.map((item) => importMetadataObjectStringFromYAML(context, objectRule, item)!)
}

registerTypeRule("MetadataObjectRefCollection", "importFromYAML", importMetadataObjectRefCollectionFromYAML)
