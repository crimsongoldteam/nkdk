import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportCharacteristicsDescriptionToXML = (
  data: CharacteristicsDescription | undefined
): CharacteristicsDescriptionXML | undefined => {
  if (!data) return undefined

  return {
    CharacteristicTypes: data.characteristicTypes,
    CharacteristicValues: data.characteristicValues,
    DataPathField: data.dataPathField,
    KeyField: data.keyField,
    MultipleValuesKeyField: data.multipleValuesKeyField,
    MultipleValuesOrderField: data.multipleValuesOrderField,
    MultipleValuesUseField: data.multipleValuesUseField,
    ObjectField: data.objectField,
    TypeField: data.typeField,
    TypesFilterField: data.typesFilterField,
    TypesFilterValue: data.typesFilterValue,
    ValueField: data.valueField,
  }
}

registerExport(FormElementType.CharacteristicsDescription, exportCharacteristicsDescriptionToXML)
