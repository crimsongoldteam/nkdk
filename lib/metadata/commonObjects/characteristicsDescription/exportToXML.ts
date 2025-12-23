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
  configurationSettings: ConfigurationSettings,
  data: CharacteristicsDescription | undefined
): CharacteristicsDescriptionXML | undefined => {
  if (!data) return undefined

  return compactObject({
    CharacteristicTypes: exportMetadataItemLinkToXML(configurationSettings, data.characteristicTypes),
    CharacteristicValues: exportMetadataValueToXML(configurationSettings, data.characteristicValues),
    DataPathField: exportMetadataFieldToXML(configurationSettings, data.dataPathField),
    KeyField: exportMetadataFieldToXML(configurationSettings, data.keyField),
    MultipleValuesKeyField: exportMetadataFieldToXML(configurationSettings, data.multipleValuesKeyField),
    MultipleValuesOrderField: exportMetadataFieldToXML(configurationSettings, data.multipleValuesOrderField),
    MultipleValuesUseField: exportMetadataFieldToXML(configurationSettings, data.multipleValuesUseField),
    ObjectField: exportMetadataFieldToXML(configurationSettings, data.objectField),
    TypeField: exportMetadataFieldToXML(configurationSettings, data.typeField),
    TypesFilterField: exportMetadataFieldToXML(configurationSettings, data.typesFilterField),
    TypesFilterValue: exportMetadataValueToXML(configurationSettings, data.typesFilterValue),
    ValueField: exportMetadataFieldToXML(configurationSettings, data.valueField),
  })
}

export const exportCharacteristicsDescriptionsToXML = (
  configurationSettings: ConfigurationSettings,
  data: CharacteristicsDescriptions | undefined
): CharacteristicsDescriptionsXML | undefined => {
  if (!data) return undefined

  return data.map(
    (value: CharacteristicsDescription) => exportCharacteristicsDescriptionToXML(configurationSettings, value)!
  )
}
