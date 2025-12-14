export type Field = string

export interface FieldXML {
  "xsi:type": "xr:MDObjectRef"
  "#text": string
}

export type FieldEnterprise = string

export type FieldList = Field[]
export type FieldListXML = FieldXML[]
export type FieldListEnterprise = FieldEnterprise[]
