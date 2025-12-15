import {
  MetadataItemLink,
  MetadataItemLinkEnterprise,
  MetadataItemLinkXML,
} from "~/lib/metadata/commonObjects/metadataItemLink/types"
import {
  MetadataValue,
  MetadataValueEnterprise,
  MetadataValueXML,
} from "~/lib/metadata/commonObjects/metadataValue/types"
import { MetadataField, MetadataFieldEnterprise, MetadataFieldXML } from "../metadataField/types"

export interface CharacteristicsDescription {
  characteristicTypes?: MetadataItemLink
  characteristicValues?: MetadataValue
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
  CharacteristicTypes?: MetadataItemLinkXML
  CharacteristicValues?: MetadataValueXML
  DataPathField?: MetadataFieldXML
  KeyField?: MetadataFieldXML
  MultipleValuesKeyField?: MetadataFieldXML
  MultipleValuesOrderField?: MetadataFieldXML
  MultipleValuesUseField?: MetadataFieldXML
  ObjectField?: MetadataFieldXML
  TypeField?: MetadataFieldXML
  TypesFilterField?: MetadataFieldXML
  TypesFilterValue?: MetadataValueXML
  ValueField?: MetadataFieldXML
}

export interface CharacteristicsDescriptionEnterprise {
  ВидыХарактеристик?: MetadataItemLinkEnterprise
  ЗначенияХарактеристик?: MetadataValueEnterprise
  ПолеПутиКДанным?: MetadataFieldEnterprise
  ПолеКлюча?: MetadataFieldEnterprise
  ПолеКлючаМножественныхЗначений?: MetadataFieldEnterprise
  ПолеПорядкаМножественныхЗначений?: MetadataFieldEnterprise
  ПолеИспользованияМножественныхЗначений?: MetadataFieldEnterprise
  ПолеОбъекта?: MetadataFieldEnterprise
  ПолеВида?: MetadataFieldEnterprise
  ПолеОтбораВидов?: MetadataFieldEnterprise
  ЗначениеОтбораВидов?: MetadataValueEnterprise
  ПолеЗначения?: MetadataFieldEnterprise
}

export type CharacteristicsDescriptions = CharacteristicsDescription[]
export type CharacteristicsDescriptionsXML = CharacteristicsDescriptionXML[]
export type CharacteristicsDescriptionsEnterprise = CharacteristicsDescriptionEnterprise[]
