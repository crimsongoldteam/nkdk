import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { Type } from "@sinclair/typebox"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"

//#region ChoiceParameterLink

export interface ChoiceParameterLink {
  name: string
  dataPath: string
  valueChange?: SE.LinkedValueChangeMode
}

export type ChoiceParameterLinks = ChoiceParameterLink[]
//#endregion

//#region ChoiceParameterLinkXML

export interface ChoiceParameterLinkXML {
  "xr:Name": string
  "xr:DataPath": MetadataPrimitiveValueXML
  "xr:ValueChange"?: SE.LinkedValueChangeMode
}

export interface ChoiceParameterLinksXML {
  "xr:Link": ChoiceParameterLinkXML[]
}

//#endregion

//#region ChoiceParameterLink DCS (dcscor)

/** Один элемент внутри `dcscor:value xsi:type="dcscor:ChoiceParameterLinks"`. */
export interface ChoiceParameterLinkDcsItemXML {
  "dcscor:choiceParameter": string | { "#text"?: string }
  "dcscor:value": string | { "#text"?: string }
  "dcscor:mode"?: SE.LinkedValueChangeMode | ChoiceParameterLinkDcsModeXML
}

export interface ChoiceParameterLinkDcsModeXML {
  "_xsi:type": "ent:LinkedValueChangeMode"
  "#text"?: SE.LinkedValueChangeMode
}

/** Корень фрагмента для `xmlExport`: узел `dcscor:value` с типом ChoiceParameterLinks. */
export interface ChoiceParameterLinkDcsValueRootXML {
  "dcscor:value": {
    "_xsi:type": "dcscor:ChoiceParameterLinks"
    "dcscor:item": ChoiceParameterLinkDcsItemXML | ChoiceParameterLinkDcsItemXML[]
  }
}

//#endregion

//#region ChoiceParameterLinkYAML

export interface ChoiceParameterLinkYAML {
  Имя: string
  ПутьКДанным: string
  РежимИзменения?: "НеИзменять"
}

export const ChoiceParameterLinkJSONSchema = Type.Object({
  Имя: Type.String(),
  ПутьКДанным: Type.String(),
  РежимИзменения: Type.Optional(Type.Literal("НеИзменять")),
})

export const ChoiceParameterLinksJSONSchema = Type.Union([Type.String(), Type.Array(ChoiceParameterLinkJSONSchema)])
export type ChoiceParameterLinksYAML = string | ChoiceParameterLinkYAML[]

//#endregion

export interface ChoiceParameterLinksWidePropertyRule extends WidePropertyRuleBase {
  type: "ChoiceParameterLinks"
}

export type ChoiceParameterLinksRuleParams = Omit<ChoiceParameterLinksWidePropertyRule, "type">

export function choiceParameterLinksRule<const Params extends ChoiceParameterLinksRuleParams>(
  params: WideExactRuleParams<ChoiceParameterLinksRuleParams, Params>
): Readonly<{ type: "ChoiceParameterLinks" } & Params> {
  return defineWidePropertyRule("ChoiceParameterLinks", params)
}
