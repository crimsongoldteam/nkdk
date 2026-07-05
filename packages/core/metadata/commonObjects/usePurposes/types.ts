import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { Type } from "@sinclairtypebox"
import type { Static } from "@sinclairtypebox"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"

export type UsePurposes = ("PlatformApplication" | "MobilePlatformApplication")[]

export interface UsePurposesXML {
  "v8:Value": MetadataPrimitiveValueXML | MetadataPrimitiveValueXML[]
}

export const UsePurposesJSONSchema = Type.Union([
  Type.Literal("МобильноеПриложение"),
  Type.Literal("ПлатформаИМобильноеПриложение"),
])

export type UsePurposesYAML = Static<typeof UsePurposesJSONSchema>

export interface UsePurposesWidePropertyRule extends WidePropertyRuleBase {
  type: "UsePurposes"
}

export type UsePurposesRuleParams = Omit<UsePurposesWidePropertyRule, "type">

export function usePurposesRule<const Params extends UsePurposesRuleParams>(
  params: WideExactRuleParams<UsePurposesRuleParams, Params>
): Readonly<{ type: "UsePurposes" } & Params> {
  return defineWidePropertyRule("UsePurposes", params)
}
