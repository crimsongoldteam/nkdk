import {
  MetadataField,
  MetadataFieldEnterprise,
  MetadataFieldXML,
} from "~/lib/metadata/commonObjects/metadataField/types"
import { MetadataItemLink, MetadataItemLinkEnterprise } from "~/lib/metadata/commonObjects/metadataItemLink/types"
import { MetadataValueEnterprise, MetadataValueXML } from "~/lib/metadata/commonObjects/metadataValue/types"

export interface CharacteristicsDescription {
  characteristicTypes?: MetadataItemLink
  characteristicValues?: string
  dataPathField?: MetadataField
  keyField?: MetadataField
  multipleValuesKeyField?: MetadataField
  multipleValuesOrderField?: MetadataField
  multipleValuesUseField?: MetadataField
  objectField?: MetadataField
  typeField?: MetadataField
  typesFilterField?: MetadataField
  typesFilterValue?: string
  valueField?: MetadataField
}

export interface CharacteristicsDescriptionXML {
  "xr:CharacteristicTypes"?: {
    _from?: string
    "xr:KeyField"?: MetadataFieldXML | string
    "xr:TypesFilterField"?: MetadataFieldXML | string
    "xr:TypesFilterValue"?: MetadataValueXML
    "xr:DataPathField"?: MetadataFieldXML | string | number
    "xr:MultipleValuesUseField"?: MetadataFieldXML | string
  }
  "xr:CharacteristicValues"?: {
    _from?: string
    "xr:ObjectField"?: MetadataFieldXML | string
    "xr:TypeField"?: MetadataFieldXML | string
    "xr:ValueField"?: MetadataFieldXML | string
    "xr:MultipleValuesKeyField"?: MetadataFieldXML | string | number
    "xr:MultipleValuesOrderField"?: MetadataFieldXML | string | number
  }
  "xr:DataPathField"?: MetadataFieldXML | string | number
  "xr:KeyField"?: MetadataFieldXML | string
  "xr:MultipleValuesKeyField"?: MetadataFieldXML | string | number
  "xr:MultipleValuesOrderField"?: MetadataFieldXML | string | number
  "xr:MultipleValuesUseField"?: MetadataFieldXML | string
  "xr:ObjectField"?: MetadataFieldXML | string
  "xr:TypeField"?: MetadataFieldXML | string
  "xr:TypesFilterField"?: MetadataFieldXML | string
  "xr:TypesFilterValue"?: MetadataValueXML
  "xr:ValueField"?: MetadataFieldXML | string
}

export interface CharacteristicsDescriptionEnterprise {
  ВидыХарактеристик?: MetadataItemLinkEnterprise
  ЗначениеОтбораВидов?: MetadataValueEnterprise
  ЗначенияХарактеристик?: MetadataValueEnterprise
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

export type CharacteristicsDescriptionsXML = CharacteristicsDescriptionXML[]

export type CharacteristicsDescriptionsEnterprise = CharacteristicsDescriptionEnterprise[]
