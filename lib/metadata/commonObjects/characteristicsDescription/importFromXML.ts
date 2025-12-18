import {
  CharacteristicsDescription,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsXML,
  CharacteristicsDescriptionXML,
} from "~/lib/metadata/commonObjects/characteristicsDescription/types"
import { importMetadataFieldFromXML } from "~/lib/metadata/commonObjects/metadataField/importFromXML"
import { importMetadataItemLinkFromXML } from "~/lib/metadata/commonObjects/metadataItemLink/importFromXML"
import { importMetadataValueFromXML } from "~/lib/metadata/commonObjects/metadataValue/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

export const importCharacteristicsDescriptionFromXML = (
  xml: CharacteristicsDescriptionXML | undefined,
  configurationSettings: ConfigurationSettings
): CharacteristicsDescription | undefined => {
  if (!xml) return undefined

  return compactObject({
    characteristicTypes: importMetadataItemLinkFromXML(xml.CharacteristicTypes, configurationSettings),
    characteristicValues: importMetadataValueFromXML(xml.CharacteristicValues, configurationSettings),
    dataPathField: importMetadataFieldFromXML(xml.DataPathField, configurationSettings),
    keyField: importMetadataFieldFromXML(xml.KeyField, configurationSettings),
    multipleValuesKeyField: importMetadataFieldFromXML(xml.MultipleValuesKeyField, configurationSettings),
    multipleValuesOrderField: importMetadataFieldFromXML(xml.MultipleValuesOrderField, configurationSettings),
    multipleValuesUseField: importMetadataFieldFromXML(xml.MultipleValuesUseField, configurationSettings),
    objectField: importMetadataFieldFromXML(xml.ObjectField, configurationSettings),
    typeField: importMetadataFieldFromXML(xml.TypeField, configurationSettings),
    typesFilterField: importMetadataFieldFromXML(xml.TypesFilterField, configurationSettings),
    typesFilterValue: importMetadataValueFromXML(xml.TypesFilterValue, configurationSettings),
    valueField: importMetadataFieldFromXML(xml.ValueField, configurationSettings),
  })
}

export const importCharacteristicsDescriptionsFromXML = (
  xml: CharacteristicsDescriptionsXML | undefined,
  configurationSettings: ConfigurationSettings
): CharacteristicsDescriptions | undefined => {
  if (!xml) return undefined

  return xml.map(
    (value: CharacteristicsDescriptionXML) => importCharacteristicsDescriptionFromXML(value, configurationSettings)!
  )
}
