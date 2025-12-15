import { importMetadataItemLinkFromXML } from "~/lib/metadata/commonObjects/metadataItemLink/importFromXML"
import { importMetadataValueFromXML } from "~/lib/metadata/commonObjects/metadataValue/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importMetadataFieldFromXML } from "../metadataField/importFromXML"
import { FormElementType } from "../types"

export const importCharacteristicsDescriptionFromXML = (
  xml: CharacteristicsDescriptionXML | undefined
): CharacteristicsDescription | undefined => {
  if (!xml) return undefined

  return {
    elementType: FormElementType.CharacteristicsDescription,

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

registerImport(FormElementType.CharacteristicsDescription, importCharacteristicsDescriptionFromXML)
