import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import { namedCollectionTarget } from "../../ruleRuntime/property/operationTargets"
import type { PropertyRule as WidePropertyRuleBase } from "../../ruleRuntime/property/types"

export interface MetadataSequenceDimensionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataSequenceDimensions"
}

export type MetadataSequenceDimensionsRuleParams = Omit<MetadataSequenceDimensionsWidePropertyRule, "type">

export function metadataSequenceDimensionsRule<const Params extends MetadataSequenceDimensionsRuleParams>(
  params: WideExactRuleParams<MetadataSequenceDimensionsRuleParams, Params>
): Readonly<{ type: "MetadataSequenceDimensions" } & Params> {
  return defineWidePropertyRule("MetadataSequenceDimensions", {
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "dimension",
      migrationSegment: "Измерение",
      requiresMigration: true,
    }),
  })
}
