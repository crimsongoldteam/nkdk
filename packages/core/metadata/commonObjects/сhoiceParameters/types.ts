import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { Type } from "@sinclair/typebox"
import {
  MetadataExplicitFormChoiceListValueYAML,
  MetadataExplicitFormChoiceListValueYAMLJSONSchema,
  MetadataValue,
  MetadataValueJSONSchema,
  MetadataValueXML,
  MetadataValueYAML,
} from "../metadataValue/types"

//#region ChoiceParameter

export interface ChoiceParameter {
  name: string
  value?: MetadataValue
}

export type ChoiceParameters = ChoiceParameter[]

//#endregion

//#region ChoiceParameterXML

export interface ChoiceParameterXML {
  _name: string
  "app:value"?: MetadataValueXML<{ type: "MetadataValue" }, MetadataValue>
}

export interface ChoiceParametersXML {
  "app:item": ChoiceParameterXML | ChoiceParameterXML[]
}

//#endregion

//#region ChoiceParameter DCS (dcscor)

/** Один `dcscor:item` внутри `dcscor:value xsi:type="dcscor:ChoiceParameters"`. */
export interface ChoiceParameterDcsItemXML {
  "dcscor:choiceParameter": string | { "#text"?: string }
  /** Сериализованное значение метаданных (`exportMetadataValueToXML`). */
  "dcscor:value"?: unknown
}

/** Корень фрагмента для `xmlExport`: узел `dcscor:value` с типом ChoiceParameters. */
export interface ChoiceParameterDcsValueRootXML {
  "dcscor:value": {
    "_xsi:type": "dcscor:ChoiceParameters"
    "dcscor:item": ChoiceParameterDcsItemXML | ChoiceParameterDcsItemXML[]
  }
}

//#endregion

//#region ChoiceParametersYAML

export const ChoiceParametersJSONSchema = Type.Record(
  Type.String(),
  Type.Union([
    MetadataExplicitFormChoiceListValueYAMLJSONSchema,
    MetadataValueJSONSchema,
    Type.Object({}, { additionalProperties: false }),
    Type.Undefined(),
    Type.Null(),
  ])
)

export type ChoiceParametersYAML = Record<
  string,
  MetadataExplicitFormChoiceListValueYAML | MetadataValueYAML | Record<string, never> | null | undefined
>

//#endregion

export interface ChoiceParametersWidePropertyRule extends WidePropertyRuleBase {
  type: "ChoiceParameters"
}

export type ChoiceParametersRuleParams = Omit<ChoiceParametersWidePropertyRule, "type">

export function choiceParametersRule<const Params extends ChoiceParametersRuleParams>(
  params: WideExactRuleParams<ChoiceParametersRuleParams, Params>
): Readonly<{ type: "ChoiceParameters" } & Params> {
  return defineWidePropertyRule("ChoiceParameters", params)
}
