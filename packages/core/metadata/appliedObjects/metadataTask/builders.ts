import { createOwnerAttributeCollectionRuleBuilder } from "../../commonObjects/metadataAttribute/registerOwnerCollection"
import { createOwnerTabularSectionCollectionRuleBuilder } from "../../commonObjects/metadataTabularSection/registerOwnerCollection"
import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import { namedCollectionTarget } from "../../orchestration/property/operationTargets"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface MetadataTaskAddressingAttributesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataTaskAddressingAttributes"
}

export type MetadataTaskAddressingAttributesRuleParams = Omit<MetadataTaskAddressingAttributesWidePropertyRule, "type">

export function metadataTaskAddressingAttributesRule<const Params extends MetadataTaskAddressingAttributesRuleParams>(
  params: WideExactRuleParams<MetadataTaskAddressingAttributesRuleParams, Params>
): Readonly<{ type: "MetadataTaskAddressingAttributes"; ownerFactRole: "addressingAttributes" } & Params> {
  return defineWidePropertyRule("MetadataTaskAddressingAttributes", {
    ownerFactRole: "addressingAttributes",
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "addressingAttribute",
      migrationSegment: "РеквизитАдресации",
      requiresMigration: true,
    }),
  })
}

export const metadataTaskAttributesRule = createOwnerAttributeCollectionRuleBuilder("MetadataTaskAttributes")
export const metadataTaskTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataTaskTabularSections"
)
