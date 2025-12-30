import {
  MetadataValueCollection,
  MetadataValueCollectionEnterprise,
} from "~/metadata/commonObjects/metadataValueCollection/types"

export const single: MetadataValueCollection = ["Catalog.Контрагенты"]

export const multiple: MetadataValueCollection = ["Catalog.Контрагенты", "Document.ПриемНаРаботу"]

export const singleEnterprise: MetadataValueCollectionEnterprise = ["Справочник.Контрагенты"]

export const multipleEnterprise: MetadataValueCollectionEnterprise = [
  "Справочник.Контрагенты",
  "Документ.ПриемНаРаботу",
]
