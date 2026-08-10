import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import { exportMetadataObjectStringToYAML } from "../metadataPath/toYAML"
import type { MetadataObjectRefCollection, MetadataObjectRefCollectionYAML } from "./types"

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

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataObjectRefCollection", "exportToYAML", exportMetadataObjectRefCollectionToYAML)
