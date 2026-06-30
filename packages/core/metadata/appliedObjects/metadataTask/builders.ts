import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import { namedCollectionTarget } from "~/metadata/orchestration/property/operationTargets"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface MetadataTaskAddressingAttributesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataTaskAddressingAttributes"
}

export type MetadataTaskAddressingAttributesRuleParams = Omit<MetadataTaskAddressingAttributesWidePropertyRule, "type">

export function metadataTaskAddressingAttributesRule<const Params extends MetadataTaskAddressingAttributesRuleParams>(
  params: WideExactRuleParams<MetadataTaskAddressingAttributesRuleParams, Params>
): Readonly<{ type: "MetadataTaskAddressingAttributes" } & Params> {
  return defineWidePropertyRule("MetadataTaskAddressingAttributes", {
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "addressingAttribute",
      migrationSegment: "РеквизитАдресации",
      requiresMigration: true,
    }),
  })
}
export interface MetadataTaskTabularSectionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataTaskTabularSections"
}

export type MetadataTaskTabularSectionsRuleParams = Omit<MetadataTaskTabularSectionsWidePropertyRule, "type">

export function metadataTaskTabularSectionsRule<const Params extends MetadataTaskTabularSectionsRuleParams>(
  params: WideExactRuleParams<MetadataTaskTabularSectionsRuleParams, Params>
): Readonly<{ type: "MetadataTaskTabularSections" } & Params> {
  return defineWidePropertyRule("MetadataTaskTabularSections", {
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "tabularSection",
      migrationSegment: "ТабличнаяЧасть",
      requiresMigration: true,
    }),
  })
}
