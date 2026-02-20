export type MetadataField = string

export type MetadataFieldXML = string

export type MetadataFieldYAML = string

export type MetadataFields = MetadataField[]
export type MetadataFieldsXML = {
  "xr:Field": MetadataFieldXML | MetadataFieldXML[]
}
export type MetadataFieldsYAML = MetadataFieldYAML[]
