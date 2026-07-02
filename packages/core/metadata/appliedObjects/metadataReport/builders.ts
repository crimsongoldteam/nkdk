import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import { namedCollectionTarget } from "../../orchestration/property/operationTargets"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface MetadataReportAttributesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataReportAttributes"
}

export type MetadataReportAttributesRuleParams = Omit<MetadataReportAttributesWidePropertyRule, "type">

export function metadataReportAttributesRule<const Params extends MetadataReportAttributesRuleParams>(
  params: WideExactRuleParams<MetadataReportAttributesRuleParams, Params>
): Readonly<{ type: "MetadataReportAttributes" } & Params> {
  return defineWidePropertyRule("MetadataReportAttributes", {
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "attribute",
      migrationSegment: "Реквизит",
      requiresMigration: true,
    }),
  })
}
export interface MetadataReportTabularSectionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataReportTabularSections"
}

export type MetadataReportTabularSectionsRuleParams = Omit<MetadataReportTabularSectionsWidePropertyRule, "type">

export function metadataReportTabularSectionsRule<const Params extends MetadataReportTabularSectionsRuleParams>(
  params: WideExactRuleParams<MetadataReportTabularSectionsRuleParams, Params>
): Readonly<{ type: "MetadataReportTabularSections" } & Params> {
  return defineWidePropertyRule("MetadataReportTabularSections", {
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "tabularSection",
      migrationSegment: "ТабличнаяЧасть",
      requiresMigration: true,
    }),
  })
}
