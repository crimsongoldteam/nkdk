import {
  CharacteristicsDescription,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsXML,
  CharacteristicsDescriptionXML,
} from "~/metadata/commonObjects/characteristicsDescription/types"
import { MetadataField } from "~/metadata/commonObjects/metadataField/types"
import { exportMetadataValueToXML } from "~/metadata/commonObjects/metadataValue/toXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration"
import { MetadataValueByRule } from "../metadataValue/types"

const exportFieldValue = (field: MetadataField | undefined): string => {
  if (!field) return "-1"
  return field
}

export const exportCharacteristicsDescriptionToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: CharacteristicsDescription | undefined
): CharacteristicsDescriptionXML | undefined => {
  if (!data) return undefined

  const characteristicTypesData: CharacteristicsDescriptionXML["xr:CharacteristicTypes"] = {}

  if (data.characteristicTypes) {
    characteristicTypesData._from = data.characteristicTypes
  }

  characteristicTypesData["xr:DataPathField"] = exportFieldValue(data.dataPathField)

  if (data.keyField) {
    characteristicTypesData["xr:KeyField"] = exportFieldValue(data.keyField)
  }

  characteristicTypesData["xr:MultipleValuesUseField"] = exportFieldValue(data.multipleValuesUseField)

  if (data.typesFilterField) {
    characteristicTypesData["xr:TypesFilterField"] = exportFieldValue(data.typesFilterField)
  }

  if (data.typesFilterValue) {
    characteristicTypesData["xr:TypesFilterValue"] = exportMetadataValueToXML({
      context,
      rule: { type: "MetadataValue" },
      value: data.typesFilterValue as MetadataValueByRule<{ type: "MetadataValue" }>,
    })
  }

  const characteristicValuesData: CharacteristicsDescriptionXML["xr:CharacteristicValues"] = {}

  if (data.characteristicValues) {
    characteristicValuesData._from = data.characteristicValues
  }

  characteristicValuesData["xr:MultipleValuesKeyField"] = exportFieldValue(data.multipleValuesKeyField)

  characteristicValuesData["xr:MultipleValuesOrderField"] = exportFieldValue(data.multipleValuesOrderField)

  if (data.objectField) {
    characteristicValuesData["xr:ObjectField"] = exportFieldValue(data.objectField)
  }

  if (data.typeField) {
    characteristicValuesData["xr:TypeField"] = exportFieldValue(data.typeField)
  }

  if (data.valueField) {
    characteristicValuesData["xr:ValueField"] = exportFieldValue(data.valueField)
  }

  const result: CharacteristicsDescriptionXML = {}

  if (Object.keys(characteristicTypesData).length > 0) {
    result["xr:CharacteristicTypes"] = characteristicTypesData
  }

  const hasCharacteristicValues =
    data.characteristicValues ||
    data.objectField ||
    data.typeField ||
    data.valueField ||
    data.multipleValuesKeyField ||
    data.multipleValuesOrderField

  if (hasCharacteristicValues && Object.keys(characteristicValuesData).length > 0) {
    result["xr:CharacteristicValues"] = characteristicValuesData
  }

  return result
}

export const exportCharacteristicsDescriptionsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: CharacteristicsDescriptions | undefined
): CharacteristicsDescriptionsXML | undefined => {
  if (!data) return undefined

  return {
    "xr:Characteristic": data
      .map((value: CharacteristicsDescription) => exportCharacteristicsDescriptionToXML(context, undefined, value))
      .filter((value): value is CharacteristicsDescriptionXML => value !== undefined),
  }
}

registerTypeRule("CharacteristicsDescriptions", "exportToXML", exportCharacteristicsDescriptionsToXML)
