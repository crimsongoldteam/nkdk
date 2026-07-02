import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { Type } from "@sinclair/typebox"
import {
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueJSONSchema,
  MetadataFormChoiceListValueXML,
  MetadataFormChoiceListValueYAML,
} from "../metadataValue/types"

//#region ChoiceList
export type ChoiceList = MetadataFormChoiceListValue[]

//#endregion

//#region ChoiceListXML

export interface ChoiceListItemXML {
  "xr:Presentation"?: ""
  "xr:CheckState": 0
  "xr:Value": MetadataFormChoiceListValueXML
}

export interface ChoiceListXML {
  "xr:Item": ChoiceListItemXML | ChoiceListItemXML[]
}

//#endregion

//#region ChoiceListYAML

export const ChoiceListJSONSchema = Type.Array(MetadataFormChoiceListValueJSONSchema)
export type ChoiceListYAML = MetadataFormChoiceListValueYAML[]

//#endregion

export interface ChoiceListWidePropertyRule extends WidePropertyRuleBase {
  type: "ChoiceList"
}

export type ChoiceListRuleParams = Omit<ChoiceListWidePropertyRule, "type">

export function choiceListRule<const Params extends ChoiceListRuleParams>(
  params: WideExactRuleParams<ChoiceListRuleParams, Params>
): Readonly<{ type: "ChoiceList" } & Params> {
  return defineWidePropertyRule("ChoiceList", params)
}
