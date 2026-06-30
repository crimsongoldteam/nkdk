import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PDFDocumentFieldRules } from "./rules"

export type PDFDocumentField = FormTypeByRule<typeof PDFDocumentFieldRules>

export type PDFDocumentFieldPartialYAML = YAMLTypeByRule<typeof PDFDocumentFieldRules>

export type PDFDocumentFieldEnterprise = EnterpriseType<typeof PDFDocumentFieldRules>

export interface SingleViewStatusAdditionWidePropertyRule extends WidePropertyRuleBase {
  type: "SingleViewStatusAddition"
}

export type SingleViewStatusAdditionRuleParams = Omit<SingleViewStatusAdditionWidePropertyRule, "type">

export function singleViewStatusAdditionRule<const Params extends SingleViewStatusAdditionRuleParams>(
  params: WideExactRuleParams<SingleViewStatusAdditionRuleParams, Params>
): Readonly<{ type: "SingleViewStatusAddition" } & Params> {
  return defineWidePropertyRule("SingleViewStatusAddition", params)
}
