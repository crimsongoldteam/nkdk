import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { Type } from "@sinclair/typebox"
import {
  MetadataTypedValue,
  MetadataValueJSONSchema,
  MetadataValueXML,
  MetadataValueYAML,
} from "../metadataValue/types"

export type MobileDeviceCommandBarContent = MetadataTypedValue[]

export interface MobileDeviceCommandBarContentItemXML {
  "xr:Presentation"?: ""
  "xr:CheckState": 0
  "xr:Value": MetadataValueXML
}

export interface MobileDeviceCommandBarContentXML {
  "xr:Item"?: MobileDeviceCommandBarContentItemXML | MobileDeviceCommandBarContentItemXML[]
}

export const MobileDeviceCommandBarContentJSONSchema = Type.Array(MetadataValueJSONSchema)
export type MobileDeviceCommandBarContentYAML = MetadataValueYAML[]

export interface MobileDeviceCommandBarContentWidePropertyRule extends WidePropertyRuleBase {
  type: "MobileDeviceCommandBarContent"
}

export type MobileDeviceCommandBarContentRuleParams = Omit<MobileDeviceCommandBarContentWidePropertyRule, "type">

export function mobileDeviceCommandBarContentRule<const Params extends MobileDeviceCommandBarContentRuleParams>(
  params: WideExactRuleParams<MobileDeviceCommandBarContentRuleParams, Params>
): Readonly<{ type: "MobileDeviceCommandBarContent" } & Params> {
  return defineWidePropertyRule("MobileDeviceCommandBarContent", params)
}
