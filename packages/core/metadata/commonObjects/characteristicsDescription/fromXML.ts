import {
  CharacteristicsDescription,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsXML,
  CharacteristicsDescriptionXML,
} from "~/metadata/commonObjects/characteristicsDescription/types"
import { MetadataField, MetadataFieldXML } from "~/metadata/commonObjects/metadataField/types"
import { importMetadataValueFromXML } from "~/metadata/commonObjects/metadataValue/fromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory"

const extractFieldValue = (field: MetadataFieldXML | string | number | undefined): MetadataField | undefined => {
  if (field === undefined) return undefined
  if (typeof field === "string") {
    if (field === "-1") return undefined
    return field
  }
  if (typeof field === "number") {
    if (field === -1) return undefined
    return String(field)
  }
  const text = field["#text"]
  if (text === "-1") return undefined
  return text
}

export const importCharacteristicsDescriptionFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: CharacteristicsDescriptionXML | undefined
): CharacteristicsDescription | undefined => {
  if (!xml) return undefined

  const characteristicTypes = xml["xr:CharacteristicTypes"]
  const characteristicValues = xml["xr:CharacteristicValues"]

  const result: CharacteristicsDescription = {} as CharacteristicsDescription

  if (characteristicTypes?._from !== undefined) result.characteristicTypes = characteristicTypes._from

  if (characteristicValues?._from !== undefined) result.characteristicValues = characteristicValues._from

  const dataPathField = extractFieldValue(characteristicTypes?.["xr:DataPathField"])
  if (dataPathField !== undefined) result.dataPathField = dataPathField

  const keyField = extractFieldValue(characteristicTypes?.["xr:KeyField"])
  if (keyField !== undefined) result.keyField = keyField

  const multipleValuesKeyField = extractFieldValue(characteristicValues?.["xr:MultipleValuesKeyField"])
  if (multipleValuesKeyField !== undefined) result.multipleValuesKeyField = multipleValuesKeyField

  const multipleValuesOrderField = extractFieldValue(characteristicValues?.["xr:MultipleValuesOrderField"])
  if (multipleValuesOrderField !== undefined) result.multipleValuesOrderField = multipleValuesOrderField

  const multipleValuesUseField = extractFieldValue(characteristicTypes?.["xr:MultipleValuesUseField"])
  if (multipleValuesUseField !== undefined) result.multipleValuesUseField = multipleValuesUseField

  const objectField = extractFieldValue(characteristicValues?.["xr:ObjectField"])
  if (objectField !== undefined) result.objectField = objectField

  const typeField = extractFieldValue(characteristicValues?.["xr:TypeField"])
  if (typeField !== undefined) result.typeField = typeField

  const typesFilterField = extractFieldValue(characteristicTypes?.["xr:TypesFilterField"])
  if (typesFilterField !== undefined) result.typesFilterField = typesFilterField

  const typesFilterValue = importMetadataValueFromXML(context, undefined, characteristicTypes?.["xr:TypesFilterValue"])
  if (typesFilterValue !== undefined) result.typesFilterValue = typesFilterValue

  const valueField = extractFieldValue(characteristicValues?.["xr:ValueField"])
  if (valueField !== undefined) result.valueField = valueField

  return result
}

export const importCharacteristicsDescriptionsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: CharacteristicsDescriptionsXML | undefined
): CharacteristicsDescriptions | undefined => {
  if (!xml) return undefined

  const characteristics = xml["xr:Characteristic"]
  const items = Array.isArray(characteristics) ? characteristics : [characteristics]

  return items.map(
    (value: CharacteristicsDescriptionXML) => importCharacteristicsDescriptionFromXML(context, undefined, value)!
  )
}

registerTypeRule("CharacteristicsDescription", "importFromXML", importCharacteristicsDescriptionsFromXML)
