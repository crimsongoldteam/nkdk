import { MetadataField, MetadataFieldYAML } from "~/metadata/commonObjects/metadataField/types"
import { MetadataItemLink, MetadataItemLinkYAML } from "~/metadata/commonObjects/metadataRef/types"
import { MetadataValue, MetadataValueXML, MetadataValueYAML } from "~/metadata/commonObjects/metadataValue/types"

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

export interface CharacteristicsDescriptionYAML {
  ВидыХарактеристик?: MetadataItemLinkYAML
  ЗначениеОтбораВидов?: MetadataValueYAML
  ЗначенияХарактеристик?: MetadataItemLinkYAML
  ПолеВида?: MetadataFieldYAML
  ПолеЗначения?: MetadataFieldYAML
  ПолеИспользованияМножественныхЗначений?: MetadataFieldYAML
  ПолеКлюча?: MetadataFieldYAML
  ПолеКлючаМножественныхЗначений?: MetadataFieldYAML
  ПолеОбъекта?: MetadataFieldYAML
  ПолеОтбораВидов?: MetadataFieldYAML
  ПолеПорядкаМножественныхЗначений?: MetadataFieldYAML
  ПолеПутиКДанным?: MetadataFieldYAML
}

export type CharacteristicsDescriptions = CharacteristicsDescription[]

export type CharacteristicsDescriptionsXML = { "xr:Characteristic": CharacteristicsDescriptionXML[] }

export type CharacteristicsDescriptionsYAML = CharacteristicsDescriptionYAML[]
