import {
  MetadataValueCollection,
  MetadataValueCollectionYAML,
} from "~/metadata/commonObjects/metadataValueCollection/types"

export const single: MetadataValueCollection = ["Catalog.Контрагенты"]

export const multiple: MetadataValueCollection = ["Catalog.Контрагенты", "Document.ПриемНаРаботу"]

export const singleYAML: MetadataValueCollectionYAML = ["Справочник.Контрагенты"]

export const multipleYAML: MetadataValueCollectionYAML = ["Справочник.Контрагенты", "Документ.ПриемНаРаботу"]
