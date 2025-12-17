import { IndexFields, IndexFieldsEnterprise, IndexFieldsXML } from "~/lib/metadata/commonObjects/indexField/types"

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

export interface AdditionalIndexEnterprise {
  ДополнительныеПоля?: IndexFieldsEnterprise
  ИндексируемыеПоля?: IndexFieldsEnterprise
  Имя?: string
  Таблица?: string
}

export type AdditionalIndexes = AdditionalIndex[]

export type AdditionalIndexesXML = AdditionalIndexXML[]

export type AdditionalIndexesEnterprise = AdditionalIndexEnterprise[]
