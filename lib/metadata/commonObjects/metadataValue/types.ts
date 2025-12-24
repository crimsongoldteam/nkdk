import { I8nTextXML } from "../i8nText/types"

//#region MetadataValue

export type MetadataValueType =
  | "string"
  | "number"
  | "dateTime"
  | "boolean"
  | "designTimeRef"
  | "ref"
  | "ApplicationUsePurpose"
  | "fixedArray"
  | "formChoiceListDesTimeValue"

export interface MetadataAbstractValue {
  type: MetadataValueType
}

export interface MetadataStringValue {
  type: "string"
  value: string
}

export interface MetadataNumberValue {
  type: "decimal"
  value: number
}

export interface MetadataDateTimeValue {
  type: "dateTime"
  value: string
}

export interface MetadataBooleanValue {
  type: "boolean"
  value: boolean
}

export interface MetadataRefValue {
  type: "designTimeRef"
  value: string
}

export interface MetadataRefValueNew {
  type: "ref"
  value: string
}

export interface MetadataApplicationUsePurposeValue {
  type: "ApplicationUsePurpose"
  value: string
}

export interface MetadataFixedArrayValue {
  type: "fixedArray"
  value: MetadataValue[]
}

export interface MetadataFormChoiceListValue {
  type: "formChoiceListDesTimeValue"
  value: MetadataValue
}

export type MetadataValue =
  | MetadataStringValue
  | MetadataNumberValue
  | MetadataDateTimeValue
  | MetadataBooleanValue
  | MetadataRefValue
  | MetadataRefValueNew
  | MetadataApplicationUsePurposeValue
  | MetadataFixedArrayValue
  | MetadataFormChoiceListValue

//#region MetadataValueXML

export interface MetadataSimpleValueXML {
  "_xsi:type":
    | "xs:string"
    | "xs:number"
    | "xs:dateTime"
    | "xs:boolean"
    | "xr:DesignTimeRef"
    | "xr:MDObjectRef"
    | "app:ApplicationUsePurpose"
    | "v8:FixedArray"
    | "FormChoiceListDesTimeValue"

  "#text": string
}

export interface MetadataFixedArrayValueXML {
  "_xsi:type": "v8:FixedArray"
  "v8:Value": MetadataValueXML | MetadataValueXML[]
}

export interface MetadataFormChoiceListDesTimeValueXML {
  "_xsi:type": "FormChoiceListDesTimeValue"
  Presentation?: I8nTextXML
  Value: MetadataValueXML
}

export type MetadataValueXML =
  | MetadataSimpleValueXML
  | MetadataFixedArrayValueXML
  | MetadataFormChoiceListDesTimeValueXML

//#endregion

export interface MetadataValueEnterprise {
  Тип: string
  Значение: string
}
