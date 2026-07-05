import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { Type } from "typebox"
import type { Static } from "typebox"

export type InternalInfoItem = {
  typeId: string
  valueId: string
}

export type InternalInfoContainedObject = {
  classId: string
  objectId: string
}

export interface InternalInfo {
  thisNode?: string
  containedObjects?: InternalInfoContainedObject[]
  [generatedTypeName: string]: InternalInfoItem | string | InternalInfoContainedObject[] | undefined
}

export interface InternalInfoParam {
  name: string
  category: string
}

export interface InternalInfoXML {
  _name: string
  _category: string
  "xr:TypeId": string
  "xr:ValueId": string
}

/** Корневой XML-элемент InternalInfo при чтении (содержит массив xr:GeneratedType) */
export interface InternalInfoRootXML {
  "xr:GeneratedType"?: InternalInfoXML | InternalInfoXML[]
  "xr:ThisNode"?: string
  "xr:ContainedObject"?: InternalInfoContainedObjectXML | InternalInfoContainedObjectXML[]
}

export interface InternalInfoContainedObjectXML {
  "xr:ClassId": string
  "xr:ObjectId": string
}

export type InternalInfoItemsXML<T extends InternalInfoParam[]> = {
  "xr:GeneratedType": {
    _name: T[number]["name"]
    _category: T[number]["category"]
    "xr:TypeId": string
    "xr:ValueId": string
  }[]
  "xr:ThisNode"?: string
}

export type InternalInfoParams = InternalInfoParam[]

export const InternalInfoParamJSONSchema = Type.Object({
  name: Type.String(),
  category: Type.String(),
})
export type InternalInfoParamFromSchema = Static<typeof InternalInfoParamJSONSchema>

export interface InternalInfoWidePropertyRule extends WidePropertyRuleBase {
  type: "InternalInfo"
}

export type InternalInfoRuleParams = Omit<InternalInfoWidePropertyRule, "type">

export function internalInfoRule<const Params extends InternalInfoRuleParams>(
  params: WideExactRuleParams<InternalInfoRuleParams, Params>
): Readonly<{ type: "InternalInfo" } & Params> {
  return defineWidePropertyRule("InternalInfo", params)
}
