export type MetadataField = string

export interface MetadataFieldXML {
  "xsi:type": "xr:MDObjectRef" | "xs:string" | "xs:boolean"
  "#text": string
}

export type MetadataFieldEnterprise = string

export type MetadataFields = MetadataField[]
export type MetadataFieldsXML = MetadataFieldXML[]
export type MetadataFieldsEnterprise = MetadataFieldEnterprise[]
