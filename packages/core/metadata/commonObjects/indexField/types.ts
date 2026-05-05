import { Static, Type } from "@sinclair/typebox"

export type IndexField = string

// XML-структура: <IndexedFields><Field>name1</Field><Field>name2</Field></IndexedFields>
// После парсинга: { Field: "name1" } или { Field: ["name1", "name2"] }
export interface IndexFieldsXML {
  Field?: string | string[]
}

export const IndexFieldJSONSchema = Type.String()
export type IndexFieldYAML = Static<typeof IndexFieldJSONSchema>

export type IndexFields = IndexField[]
export type IndexFieldsYAML = IndexFieldYAML[]
