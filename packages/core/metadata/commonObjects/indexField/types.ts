import { Static, Type } from "@sinclair/typebox"

export type IndexField = string

export interface IndexFieldXML {
  Name: string
}

export const IndexFieldJSONSchema = Type.String()
export type IndexFieldYAML = Static<typeof IndexFieldJSONSchema>

export type IndexFields = IndexField[]
export type IndexFieldsXML = IndexFieldXML[]
export type IndexFieldsYAML = IndexFieldYAML[]
