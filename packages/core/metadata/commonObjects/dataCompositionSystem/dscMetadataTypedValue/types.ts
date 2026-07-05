import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"
import { Type } from "typebox"
import { BasePropertyRule } from "../../../orchestration"
import { BooleanJSONSchema } from "../../boolean/types"
import {
  StandartBeginningDate,
  StandartBeginningDateJSONSchema,
  StandartBeginningDateYAML,
  StandartBeginningDateXML,
} from "../../standartBeginningDate/types"

export type DcsMetadataTypedValuePropertyRule = BasePropertyRule & {
  type: "DcsMetadataTypedValue"
}

export type DcsMetadataTypedValue =
  | {
      type: "Field"
      value: string
    }
  | {
      type: "DesignTimeValue"
      value: string
    }
  | {
      type: "ref"
      value: string
    }
  | {
      type: "decimal"
      value: number
    }
  | {
      type: "boolean"
      value: boolean
    }
  | {
      type: "dateTime"
      value: string
    }
  | {
      type: "string"
      value: string
    }
  | {
      type: "StandardBeginningDate"
      value: StandartBeginningDate
    }
  | {
      type: "EmptyValueList"
    }
  | {
      type: "Order"
    }

export const DcsMetadataTypedValueJSONSchema = Type.Union([
  Type.Literal("Порядок"),
  Type.Literal("СписокЗначений"),
  Type.String(),
  Type.Number(),
  BooleanJSONSchema,
  StandartBeginningDateJSONSchema,
])

export type DcsMetadataTypedValueYAML = "Порядок" | "СписокЗначений" | string | number | StandartBeginningDateYAML
export type DcsMetadataTypedValueNilArrayItemYAML = Record<string, never>
export type DcsMetadataTypedValueArrayItemYAML = DcsMetadataTypedValueYAML | DcsMetadataTypedValueNilArrayItemYAML

export type DcsMetadataTypedValueUndefinedTypeXML = {
  "_xsi:type": "v8:Type"
  "#text"?: string
  [key: `_xmlns:${string}`]: string | undefined
}

export type DcsMetadataTypedValueNilXML = {
  "_xsi:nil": true | "true"
}

export type DcsMetadataTypedValueReference = DcsMetadataTypedValue | DcsMetadataTypedValueUndefinedTypeXML
export type DcsMetadataTypedValueReferenceOrNil = DcsMetadataTypedValueReference | undefined

export type DcsMetadataTypedValueXML =
  | {
      "_xsi:type": "dcscor:Field"
      "#text"?: string
    }
  | {
      "_xsi:type": "dcscor:DesignTimeValue"
      "#text"?: string
    }
  | {
      "_xsi:type": "xr:DesignTimeRef"
      "#text"?: string
    }
  | {
      "_xsi:type": "xs:decimal"
      "#text"?: string
    }
  | {
      "_xsi:type": "xs:boolean"
      "#text"?: string
    }
  | {
      "_xsi:type": "xs:dateTime"
      "#text"?: string
    }
  | {
      "_xsi:type": "xs:string"
      "#text"?: string
    }
  | {
      "_xsi:type": "v8:ValueListType"
      "v8:valueType"?: Record<string, never>
      "v8:lastId"?: {
        "_xsi:type": "xs:decimal"
        "#text"?: string
      }
    }
  | {
      "_xsi:type": "dcsset:Order"
    }
  | DcsMetadataTypedValueUndefinedTypeXML
  | DcsMetadataTypedValueNilXML
  | StandartBeginningDateXML

export interface DcsMetadataTypedValueWidePropertyRule extends WidePropertyRuleBase {
  type: "DcsMetadataTypedValue"
}

export type DcsMetadataTypedValueRuleParams = Omit<DcsMetadataTypedValueWidePropertyRule, "type">

export function dcsMetadataTypedValueRule<const Params extends DcsMetadataTypedValueRuleParams>(
  params: WideExactRuleParams<DcsMetadataTypedValueRuleParams, Params>
): Readonly<{ type: "DcsMetadataTypedValue" } & Params> {
  return defineWidePropertyRule("DcsMetadataTypedValue", params)
}
