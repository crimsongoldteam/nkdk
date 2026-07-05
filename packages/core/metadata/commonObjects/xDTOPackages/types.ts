import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { Type } from "@sinclairtypebox"
import type { Static } from "@sinclairtypebox"

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
