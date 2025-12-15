import { IndexFields, IndexFieldsEnterprise, IndexFieldsXML } from "~/lib/metadata/commonObjects/indexField/types"

export interface AdditionalIndex {
  additionalFields?: IndexFields
  indexedFields?: IndexFields
  table?: string
}

export interface AdditionalIndexXML {
  AdditionalFields?: IndexFieldsXML
  IndexedFields?: IndexFieldsXML
  Table?: string
}

export interface AdditionalIndexEnterprise {
  ДополнительныеПоля?: IndexFieldsEnterprise
  ИндексируемыеПоля?: IndexFieldsEnterprise
  Таблица?: string
}

export type AdditionalIndexes = AdditionalIndex[]
export type AdditionalIndexesXML = AdditionalIndexXML[]
export type AdditionalIndexesEnterprise = AdditionalIndexEnterprise[]
