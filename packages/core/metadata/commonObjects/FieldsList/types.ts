import { Static, Type } from "@sinclair/typebox"

export type FieldsList = string[]

export interface FieldsListXML {
  Field: string | string[]
}

export const FieldsListJSONSchema = Type.Array(Type.String())

export type FieldsListYAML = Static<typeof FieldsListJSONSchema>
