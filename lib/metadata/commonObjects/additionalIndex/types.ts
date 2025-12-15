import { IndexFields, IndexFieldsEnterprise, IndexFieldsXML } from "~/lib/metadata/commonObjects/indexField/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"

export interface AdditionalIndex {
  additionalFields?: IndexFields
  indexedFields?: IndexFields
  table?: string
  userVisible?: UserVisible
}

export interface AdditionalIndexXML {
  AdditionalFields?: IndexFieldsXML
  IndexedFields?: IndexFieldsXML
  Table?: string
  UserVisible?: UserVisibleXML
}

export interface AdditionalIndexEnterprise {
  ДополнительныеПоля?: IndexFieldsEnterprise
  ИндексируемыеПоля?: IndexFieldsEnterprise
  Таблица?: string
  ПользовательскаяВидимость?: UserVisibleEnterprise
}
