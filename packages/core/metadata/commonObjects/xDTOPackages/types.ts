import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { Static, Type } from "@sinclair/typebox"

export const XDTOPackagesJSONSchema = Type.Array(Type.String())
export type XDTOPackages = string[]
export type XDTOPackagesYAML = Static<typeof XDTOPackagesJSONSchema>

export interface XDTOPackageXMLItem {
  "xr:Presentation"?: string
  "xr:CheckState"?: number
  "xr:Value": {
    "_xsi:type": "xr:MDObjectRef" | "xs:string"
    "#text"?: string
  }
}

export interface XDTOPackagesXML {
  "xr:Item"?: XDTOPackageXMLItem | XDTOPackageXMLItem[]
}

export interface XDTOPackagesWidePropertyRule extends WidePropertyRuleBase {
  type: "XDTOPackages"
}

export type XDTOPackagesRuleParams = Omit<XDTOPackagesWidePropertyRule, "type">

export function xDTOPackagesRule<const Params extends XDTOPackagesRuleParams>(
  params: WideExactRuleParams<XDTOPackagesRuleParams, Params>
): Readonly<{ type: "XDTOPackages" } & Params> {
  return defineWidePropertyRule("XDTOPackages", params)
}
