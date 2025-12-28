import { MetadataField, MetadataFieldEnterprise } from "~/metadata/commonObjects/metadataField/types"
import { MetadataItemLink, MetadataItemLinkEnterprise } from "~/metadata/commonObjects/metadataRef/types"
import { MetadataValue, MetadataValueEnterprise, MetadataValueXML } from "~/metadata/commonObjects/metadataValue/types"

export interface CharacteristicsDescription {
  characteristicTypes?: MetadataItemLink
  characteristicValues?: MetadataItemLink
  dataPathField?: MetadataField
  keyField?: MetadataField
  multipleValuesKeyField?: MetadataField
  multipleValuesOrderField?: MetadataField
  multipleValuesUseField?: MetadataField
  objectField?: MetadataField
  typeField?: MetadataField
  typesFilterField?: MetadataField
  typesFilterValue?: MetadataValue
  valueField?: MetadataField
}

export interface CharacteristicsDescriptionXML {
  "xr:CharacteristicTypes"?: {
    _from?: string
    "xr:KeyField"?: string
    "xr:TypesFilterField"?: string
    "xr:TypesFilterValue"?: MetadataValueXML
    "xr:DataPathField"?: string
    "xr:MultipleValuesUseField"?: string
  }
  "xr:CharacteristicValues"?: {
    _from?: string
    "xr:ObjectField"?: string
    "xr:TypeField"?: string
    "xr:ValueField"?: string
    "xr:MultipleValuesKeyField"?: string
    "xr:MultipleValuesOrderField"?: string
  }
}

export interface CharacteristicsDescriptionEnterprise {
  ВидыХарактеристик?: MetadataItemLinkEnterprise
  ЗначениеОтбораВидов?: MetadataValueEnterprise
  ЗначенияХарактеристик?: MetadataItemLinkEnterprise
  ПолеВида?: MetadataFieldEnterprise
  ПолеЗначения?: MetadataFieldEnterprise
  ПолеИспользованияМножественныхЗначений?: MetadataFieldEnterprise
  ПолеКлюча?: MetadataFieldEnterprise
  ПолеКлючаМножественныхЗначений?: MetadataFieldEnterprise
  ПолеОбъекта?: MetadataFieldEnterprise
  ПолеОтбораВидов?: MetadataFieldEnterprise
  ПолеПорядкаМножественныхЗначений?: MetadataFieldEnterprise
  ПолеПутиКДанным?: MetadataFieldEnterprise
}

export type CharacteristicsDescriptions = CharacteristicsDescription[]

export type CharacteristicsDescriptionsXML = { "xr:Characteristic": CharacteristicsDescriptionXML[] }

export type CharacteristicsDescriptionsEnterprise = CharacteristicsDescriptionEnterprise[]
