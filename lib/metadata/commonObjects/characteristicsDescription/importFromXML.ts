import {
  CharacteristicsDescription,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsXML,
  CharacteristicsDescriptionXML,
} from "~/lib/metadata/commonObjects/characteristicsDescription/types"
import { MetadataField, MetadataFieldXML } from "~/lib/metadata/commonObjects/metadataField/types"
import { importMetadataValueFromXML } from "~/lib/metadata/commonObjects/metadataValue/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

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
  configurationSettings: Context,
  xml: CharacteristicsDescriptionXML | undefined
): CharacteristicsDescription | undefined => {
  if (!xml) return undefined

  const characteristicTypes = xml["xr:CharacteristicTypes"]
  const characteristicValues = xml["xr:CharacteristicValues"]

  const typesFilterValueData = importMetadataValueFromXML(
    configurationSettings,
    characteristicTypes?.["xr:TypesFilterValue"]
  )

  return compactObject<CharacteristicsDescription>({
    characteristicTypes: characteristicTypes?._from,
    characteristicValues: characteristicValues?._from,
    dataPathField: extractFieldValue(characteristicTypes?.["xr:DataPathField"]),
    keyField: extractFieldValue(characteristicTypes?.["xr:KeyField"]),
    multipleValuesKeyField: extractFieldValue(characteristicValues?.["xr:MultipleValuesKeyField"]),
    multipleValuesOrderField: extractFieldValue(characteristicValues?.["xr:MultipleValuesOrderField"]),
    multipleValuesUseField: extractFieldValue(characteristicTypes?.["xr:MultipleValuesUseField"]),
    objectField: extractFieldValue(characteristicValues?.["xr:ObjectField"]),
    typeField: extractFieldValue(characteristicValues?.["xr:TypeField"]),
    typesFilterField: extractFieldValue(characteristicTypes?.["xr:TypesFilterField"]),
    typesFilterValue: typesFilterValueData?.value,
    valueField: extractFieldValue(characteristicValues?.["xr:ValueField"]),
  })
}

export const importCharacteristicsDescriptionsFromXML = (
  configurationSettings: Context,
  xml: CharacteristicsDescriptionsXML | undefined
): CharacteristicsDescriptions | undefined => {
  if (!xml) return undefined

  const characteristics = xml["xr:Characteristic"]
  const items = Array.isArray(characteristics) ? characteristics : [characteristics]

  return items.map(
    (value: CharacteristicsDescriptionXML) => importCharacteristicsDescriptionFromXML(configurationSettings, value)!
  )
}
