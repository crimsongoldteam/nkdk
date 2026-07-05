import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { Type } from "@sinclairtypebox"
import type { Static } from "@sinclairtypebox"
import { MetadataField } from "../metadataField/types"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"

export interface TypeLinkXML {
  "xr:DataPath": string | MetadataPrimitiveValueXML
  "xr:LinkItem": number | string
}

export interface TypeLink {
  dataPath: MetadataField
  linkItem: number
}

//#region TypeLink DCS (dcscor)

/** Корень фрагмента для `xmlExport`: узел `dcscor:value` с типом TypeLink. */
export interface TypeLinkDcsValueRootXML {
  "dcscor:value": {
    "_xsi:type": "dcscor:TypeLink"
    "dcscor:field": string | { "#text"?: string }
    "dcscor:linkItem": number | string | { "#text"?: string }
  }
}

//#endregion

export const TypeLinkJSONSchema = Type.String()

export type TypeLinkYAML = Static<typeof TypeLinkJSONSchema>

export interface TypeLinkWidePropertyRule extends WidePropertyRuleBase {
  type: "TypeLink"
}

export type TypeLinkRuleParams = Omit<TypeLinkWidePropertyRule, "type">

export function typeLinkRule<const Params extends TypeLinkRuleParams>(
  params: WideExactRuleParams<TypeLinkRuleParams, Params>
): Readonly<{ type: "TypeLink" } & Params> {
  return defineWidePropertyRule("TypeLink", params)
}
