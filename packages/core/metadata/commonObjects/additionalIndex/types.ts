import {
  IndexFields,
  IndexFieldsEnterprise,
  IndexFieldsXML,
} from "~/packages/core/metadata/commonObjects/indexField/types"

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
  Имя?: string
  ИндексируемыеПоля?: IndexFieldsEnterprise
  Таблица?: string
}

export type AdditionalIndexes = AdditionalIndex[]

export type AdditionalIndexesXML = AdditionalIndexXML[]

export type AdditionalIndexesEnterprise = AdditionalIndexEnterprise[]
