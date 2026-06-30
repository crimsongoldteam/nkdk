import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataBusinessProcessRules } from "./rules"

export type MetadataBusinessProcess = MetadataTypeByRule<typeof MetadataBusinessProcessRules>
export type MetadataBusinessProcessYAML = YAMLTypeByRule<typeof MetadataBusinessProcessRules>

registerMetadataItemRule({
  propertyType: "MetadataBusinessProcess",
  itemRule: MetadataBusinessProcessRules,
})

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
