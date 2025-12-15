import { exportMetadataItemLinkToXML } from "~/lib/metadata/commonObjects/metadataItemLink/exportToXML"
import { exportMetadataValueToXML } from "~/lib/metadata/commonObjects/metadataValue/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { exportMetadataFieldToXML } from "../metadataField/exportToXML"
import { FormElementType } from "../types"

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

registerExport(FormElementType.CharacteristicsDescription, exportCharacteristicsDescriptionToXML)
