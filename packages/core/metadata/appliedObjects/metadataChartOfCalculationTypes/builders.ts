import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import { namedCollectionTarget } from "~/metadata/orchestration/property/operationTargets"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface MetadataChartOfCalculationTypesTabularSectionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataChartOfCalculationTypesTabularSections"
}

export type MetadataChartOfCalculationTypesTabularSectionsRuleParams = Omit<
  MetadataChartOfCalculationTypesTabularSectionsWidePropertyRule,
  "type"
>

export function metadataChartOfCalculationTypesTabularSectionsRule<
  const Params extends MetadataChartOfCalculationTypesTabularSectionsRuleParams,
>(
  params: WideExactRuleParams<MetadataChartOfCalculationTypesTabularSectionsRuleParams, Params>
): Readonly<{ type: "MetadataChartOfCalculationTypesTabularSections" } & Params> {
  return defineWidePropertyRule("MetadataChartOfCalculationTypesTabularSections", {
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "tabularSection",
      migrationSegment: "ТабличнаяЧасть",
      requiresMigration: true,
    }),
  })
}
