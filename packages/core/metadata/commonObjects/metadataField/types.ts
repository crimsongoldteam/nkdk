export type MetadataField = string

export type MetadataFieldXML = string

export type MetadataFieldEnterprise = string

export type MetadataFields = MetadataField[]
export type MetadataFieldsXML = {
  "xr:Field": MetadataFieldXML | MetadataFieldXML[]
}
export type MetadataFieldsEnterprise = MetadataFieldEnterprise[]
