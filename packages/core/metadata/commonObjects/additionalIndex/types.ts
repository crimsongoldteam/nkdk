import { IndexFields, IndexFieldsXML, IndexFieldsYAML } from "~/metadata/commonObjects/indexField/types"

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

export interface AdditionalIndexYAML {
  ДополнительныеПоля?: IndexFieldsYAML
  Имя?: string
  ИндексируемыеПоля?: IndexFieldsYAML
  Таблица?: string
}

export type AdditionalIndexes = AdditionalIndex[]

export type AdditionalIndexesXML = AdditionalIndexXML[]

export type AdditionalIndexesYAML = AdditionalIndexYAML[]
