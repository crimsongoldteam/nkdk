import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import { namedCollectionTarget } from "../../orchestration/property/operationTargets"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

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
): Readonly<{ type: "MetadataBusinessProcessTabularSections"; ownerFactRole: "tabularSections" } & Params> {
  return defineWidePropertyRule("MetadataBusinessProcessTabularSections", {
    ownerFactRole: "tabularSections",
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "tabularSection",
      migrationSegment: "ТабличнаяЧасть",
      requiresMigration: true,
    }),
  })
}
