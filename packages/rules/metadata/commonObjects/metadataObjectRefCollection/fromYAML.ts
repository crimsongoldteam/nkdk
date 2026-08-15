import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import { importMetadataObjectStringFromYAML } from "../metadataPath/fromYAML"
import type { MetadataObjectRefCollection, MetadataObjectRefCollectionYAML } from "./types"
import type { ImportFromYAMLFunctionNew } from "@nkdk/runtime/rule-kit"

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

export const metadataPropertyRule000 = definePropertyTypeRule(
  "MetadataObjectRefCollection",
  "importFromYAML",
  ((params) => Array.isArray(params.value) && params.value.length === 0
    ? undefined
    : params.value) satisfies ImportFromYAMLFunctionNew,
)
