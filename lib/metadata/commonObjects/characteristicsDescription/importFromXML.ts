import {
  CharacteristicsDescription,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsXML,
  CharacteristicsDescriptionXML,
} from "~/lib/metadata/commonObjects/characteristicsDescription/types"
import { importMetadataFieldFromXML } from "~/lib/metadata/commonObjects/metadataField/importFromXML"
import { importMetadataItemLinkFromXML } from "~/lib/metadata/commonObjects/metadataItemLink/importFromXML"
import { importMetadataValueFromXML } from "~/lib/metadata/commonObjects/metadataValue/importFromXML"

export const importCharacteristicsDescriptionFromXML = (
  xml: CharacteristicsDescriptionXML | undefined
): CharacteristicsDescription | undefined => {
  if (!xml) return undefined

  return {
    characteristicTypes: importMetadataItemLinkFromXML(xml.CharacteristicTypes),
    characteristicValues: importMetadataValueFromXML(xml.CharacteristicValues),
    dataPathField: importMetadataFieldFromXML(xml.DataPathField),
    keyField: importMetadataFieldFromXML(xml.KeyField),
    multipleValuesKeyField: importMetadataFieldFromXML(xml.MultipleValuesKeyField),
    multipleValuesOrderField: importMetadataFieldFromXML(xml.MultipleValuesOrderField),
    multipleValuesUseField: importMetadataFieldFromXML(xml.MultipleValuesUseField),
    objectField: importMetadataFieldFromXML(xml.ObjectField),
    typeField: importMetadataFieldFromXML(xml.TypeField),
    typesFilterField: importMetadataFieldFromXML(xml.TypesFilterField),
    typesFilterValue: importMetadataValueFromXML(xml.TypesFilterValue),
    valueField: importMetadataFieldFromXML(xml.ValueField),
  }
}

export const importCharacteristicsDescriptionsFromXML = (
  xml: CharacteristicsDescriptionsXML | undefined
): CharacteristicsDescriptions | undefined => {
  if (!xml) return undefined

  return xml.map((value: CharacteristicsDescriptionXML) => importCharacteristicsDescriptionFromXML(value)!)
}
