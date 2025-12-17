import {
  CharacteristicsDescription,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsXML,
  CharacteristicsDescriptionXML,
} from "~/lib/metadata/commonObjects/characteristicsDescription/types"
import { exportMetadataFieldToXML } from "~/lib/metadata/commonObjects/metadataField/exportToXML"
import { exportMetadataItemLinkToXML } from "~/lib/metadata/commonObjects/metadataItemLink/exportToXML"
import { exportMetadataValueToXML } from "~/lib/metadata/commonObjects/metadataValue/exportToXML"

export const exportCharacteristicsDescriptionToXML = (
  data: CharacteristicsDescription | undefined
): CharacteristicsDescriptionXML | undefined => {
  if (!data) return undefined

  return {
    CharacteristicTypes: exportMetadataItemLinkToXML(data.characteristicTypes),
    CharacteristicValues: exportMetadataValueToXML(data.characteristicValues),
    DataPathField: exportMetadataFieldToXML(data.dataPathField),
    KeyField: exportMetadataFieldToXML(data.keyField),
    MultipleValuesKeyField: exportMetadataFieldToXML(data.multipleValuesKeyField),
    MultipleValuesOrderField: exportMetadataFieldToXML(data.multipleValuesOrderField),
    MultipleValuesUseField: exportMetadataFieldToXML(data.multipleValuesUseField),
    ObjectField: exportMetadataFieldToXML(data.objectField),
    TypeField: exportMetadataFieldToXML(data.typeField),
    TypesFilterField: exportMetadataFieldToXML(data.typesFilterField),
    TypesFilterValue: exportMetadataValueToXML(data.typesFilterValue),
    ValueField: exportMetadataFieldToXML(data.valueField),
  }
}

export const exportCharacteristicsDescriptionsToXML = (
  data: CharacteristicsDescriptions | undefined
): CharacteristicsDescriptionsXML | undefined => {
  if (!data) return undefined

  return data.map((value: CharacteristicsDescription) => exportCharacteristicsDescriptionToXML(value)!)
}
