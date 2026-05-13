import { Static, Type } from "@sinclair/typebox"
import { BasePropertyRule } from "~/metadata/orchestration"
import { BooleanJSONSchema } from "../../boolean/types"
import {
  StandartBeginningDate,
  StandartBeginningDateJSONSchema,
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
  Type.String(),
  Type.Number(),
  BooleanJSONSchema,
  StandartBeginningDateJSONSchema,
])

export type DcsMetadataTypedValueYAML = Static<typeof DcsMetadataTypedValueJSONSchema>

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
  | StandartBeginningDateXML
