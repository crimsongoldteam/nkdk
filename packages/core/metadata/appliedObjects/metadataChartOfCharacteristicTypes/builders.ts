import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import { namedCollectionTarget } from "../../orchestration/property/operationTargets"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface MetadataChartOfCharacteristicTypesTabularSectionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataChartOfCharacteristicTypesTabularSections"
}

export type MetadataChartOfCharacteristicTypesTabularSectionsRuleParams = Omit<
  MetadataChartOfCharacteristicTypesTabularSectionsWidePropertyRule,
  "type"
>

export function metadataChartOfCharacteristicTypesTabularSectionsRule<
  const Params extends MetadataChartOfCharacteristicTypesTabularSectionsRuleParams,
>(
  params: WideExactRuleParams<MetadataChartOfCharacteristicTypesTabularSectionsRuleParams, Params>
): Readonly<{ type: "MetadataChartOfCharacteristicTypesTabularSections"; ownerFactRole: "tabularSections" } & Params> {
  return defineWidePropertyRule("MetadataChartOfCharacteristicTypesTabularSections", {
    ownerFactRole: "tabularSections",
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "tabularSection",
      migrationSegment: "ТабличнаяЧасть",
      requiresMigration: true,
    }),
  })
}
