import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importCharacteristicsDescriptionFromXML = (
  xml: CharacteristicsDescriptionXML | undefined
): CharacteristicsDescription | undefined => {
  if (!xml) return undefined

  return {
    elementType: FormElementType.CharacteristicsDescription,

    characteristicTypes: xml.CharacteristicTypes,
    characteristicValues: xml.CharacteristicValues,
    dataPathField: xml.DataPathField,
    keyField: xml.KeyField,
    multipleValuesKeyField: xml.MultipleValuesKeyField,
    multipleValuesOrderField: xml.MultipleValuesOrderField,
    multipleValuesUseField: xml.MultipleValuesUseField,
    objectField: xml.ObjectField,
    typeField: xml.TypeField,
    typesFilterField: xml.TypesFilterField,
    typesFilterValue: xml.TypesFilterValue,
    valueField: xml.ValueField,
  }
}

registerImport(FormElementType.CharacteristicsDescription, importCharacteristicsDescriptionFromXML)
