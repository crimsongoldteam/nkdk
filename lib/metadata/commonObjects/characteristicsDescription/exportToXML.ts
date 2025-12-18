import {
  CharacteristicsDescription,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsXML,
  CharacteristicsDescriptionXML,
} from "~/lib/metadata/commonObjects/characteristicsDescription/types"
import { exportMetadataFieldToXML } from "~/lib/metadata/commonObjects/metadataField/exportToXML"
import { exportMetadataItemLinkToXML } from "~/lib/metadata/commonObjects/metadataItemLink/exportToXML"
import { exportMetadataValueToXML } from "~/lib/metadata/commonObjects/metadataValue/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

export const exportCharacteristicsDescriptionToXML = (
  data: CharacteristicsDescription | undefined,
  configurationSettings: ConfigurationSettings
): CharacteristicsDescriptionXML | undefined => {
  if (!data) return undefined

  return compactObject({
    CharacteristicTypes: exportMetadataItemLinkToXML(data.characteristicTypes, configurationSettings),
    CharacteristicValues: exportMetadataValueToXML(data.characteristicValues, configurationSettings),
    DataPathField: exportMetadataFieldToXML(data.dataPathField, configurationSettings),
    KeyField: exportMetadataFieldToXML(data.keyField, configurationSettings),
    MultipleValuesKeyField: exportMetadataFieldToXML(data.multipleValuesKeyField, configurationSettings),
    MultipleValuesOrderField: exportMetadataFieldToXML(data.multipleValuesOrderField, configurationSettings),
    MultipleValuesUseField: exportMetadataFieldToXML(data.multipleValuesUseField, configurationSettings),
    ObjectField: exportMetadataFieldToXML(data.objectField, configurationSettings),
    TypeField: exportMetadataFieldToXML(data.typeField, configurationSettings),
    TypesFilterField: exportMetadataFieldToXML(data.typesFilterField, configurationSettings),
    TypesFilterValue: exportMetadataValueToXML(data.typesFilterValue, configurationSettings),
    ValueField: exportMetadataFieldToXML(data.valueField, configurationSettings),
  })
}

export const exportCharacteristicsDescriptionsToXML = (
  data: CharacteristicsDescriptions | undefined,
  configurationSettings: ConfigurationSettings
): CharacteristicsDescriptionsXML | undefined => {
  if (!data) return undefined

  return data.map(
    (value: CharacteristicsDescription) => exportCharacteristicsDescriptionToXML(value, configurationSettings)!
  )
}
