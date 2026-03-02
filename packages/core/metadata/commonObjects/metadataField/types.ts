import { Static, Type } from "@sinclair/typebox"

export type MetadataField = string

export type MetadataFieldXML = string

export const MetadataFieldJSONSchema = Type.String()
export type MetadataFieldYAML = Static<typeof MetadataFieldJSONSchema>

export type MetadataFields = MetadataField[]
export type MetadataFieldsXML = {
  "xr:Field": MetadataFieldXML | MetadataFieldXML[]
}
export type MetadataFieldsYAML = MetadataFieldYAML[]
