import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
//#region MetadataObjectRefCollection

import { Static, Type } from "@sinclair/typebox"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"

export type MetadataObjectRefCollectionItem = string

export type MetadataObjectRefCollection = MetadataObjectRefCollectionItem[]

//#endregion

//#region MetadataObjectRefCollectionXML

export type MetadataObjectRefCollectionItemXML = string

export type MetadataObjectRefCollectionXML = {
  "xr:Item": MetadataPrimitiveValueXML | MetadataPrimitiveValueXML[]
}

//#endregion

//#region MetadataObjectRefCollectionYAML

export type MetadataObjectRefCollectionItemYAML = string

export const MetadataObjectRefCollectionJSONSchema = Type.Array(Type.String())
export type MetadataObjectRefCollectionYAML = Static<typeof MetadataObjectRefCollectionJSONSchema>

//#endregion

export interface MetadataObjectRefCollectionWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataObjectRefCollection"
}

export type MetadataObjectRefCollectionRuleParams = Omit<MetadataObjectRefCollectionWidePropertyRule, "type">

export function metadataObjectRefCollectionRule<const Params extends MetadataObjectRefCollectionRuleParams>(
  params: WideExactRuleParams<MetadataObjectRefCollectionRuleParams, Params>
): Readonly<{ type: "MetadataObjectRefCollection" } & Params> {
  return defineWidePropertyRule("MetadataObjectRefCollection", params)
}
