import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface MetadataBusinessProcessTabularSectionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataBusinessProcessTabularSections"
}

export type MetadataBusinessProcessTabularSectionsRuleParams = Omit<
  MetadataBusinessProcessTabularSectionsWidePropertyRule,
  "type"
>

export function metadataBusinessProcessTabularSectionsRule<
  const Params extends MetadataBusinessProcessTabularSectionsRuleParams,
>(
  params: WideExactRuleParams<MetadataBusinessProcessTabularSectionsRuleParams, Params>
): Readonly<{ type: "MetadataBusinessProcessTabularSections" } & Params> {
  return defineWidePropertyRule("MetadataBusinessProcessTabularSections", params)
}
