import { Static, Type } from "@sinclair/typebox"
import { IndexFieldJSONSchema, IndexFields, IndexFieldsXML } from "~/metadata/commonObjects/indexField/types"

export interface AdditionalIndex {
  additionalFields?: IndexFields
  indexedFields?: IndexFields
  name?: string
  table?: string
}

export interface AdditionalIndexXML {
  AdditionalFields?: IndexFieldsXML
  IndexedFields?: IndexFieldsXML
  Name?: string
  Table?: string
}

export const AdditionalIndexJSONSchema = Type.Object({
  ДополнительныеПоля: Type.Optional(Type.Array(IndexFieldJSONSchema)),
  Имя: Type.Optional(Type.String()),
  ИндексируемыеПоля: Type.Optional(Type.Array(IndexFieldJSONSchema)),
  Таблица: Type.Optional(Type.String()),
})

export type AdditionalIndexYAML = Static<typeof AdditionalIndexJSONSchema>

export type AdditionalIndexes = AdditionalIndex[]

export type AdditionalIndexesXML = AdditionalIndexXML[]

export type AdditionalIndexesYAML = AdditionalIndexYAML[]
