import {
  CharacteristicsDescription,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsXML,
  CharacteristicsDescriptionXML,
} from "~/lib/metadata/commonObjects/characteristicsDescription/types"
import { MetadataField, MetadataFieldXML } from "~/lib/metadata/commonObjects/metadataField/types"
import { importMetadataValueFromXML } from "~/lib/metadata/commonObjects/metadataValue/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

const extractFieldValue = (field: MetadataFieldXML | string | number | undefined): MetadataField | undefined => {
  if (field === undefined) return undefined
  if (typeof field === "string") return field
  if (typeof field === "number") return String(field)
  return field["#text"]
}

export const importCharacteristicsDescriptionFromXML = (
  xml: CharacteristicsDescriptionXML | undefined,
  configurationSettings: ConfigurationSettings
): CharacteristicsDescription | undefined => {
  if (!xml) return undefined

  const characteristicTypes = xml["xr:CharacteristicTypes"]
  const characteristicValues = xml["xr:CharacteristicValues"]

  return compactObject({
    characteristicTypes: characteristicTypes?._from,
    characteristicValues: characteristicValues?._from
      ? {
          type: "xs:string",
          value: characteristicValues._from,
        }
      : undefined,
    dataPathField: extractFieldValue(characteristicTypes?.["xr:DataPathField"] || xml["xr:DataPathField"]),
    keyField: extractFieldValue(characteristicTypes?.["xr:KeyField"] || xml["xr:KeyField"]),
    multipleValuesKeyField: extractFieldValue(
      characteristicValues?.["xr:MultipleValuesKeyField"] || xml["xr:MultipleValuesKeyField"]
    ),
    multipleValuesOrderField: extractFieldValue(
      characteristicValues?.["xr:MultipleValuesOrderField"] || xml["xr:MultipleValuesOrderField"]
    ),
    multipleValuesUseField: extractFieldValue(
      characteristicTypes?.["xr:MultipleValuesUseField"] || xml["xr:MultipleValuesUseField"]
    ),
    objectField: extractFieldValue(characteristicValues?.["xr:ObjectField"] || xml["xr:ObjectField"]),
    typeField: extractFieldValue(characteristicValues?.["xr:TypeField"] || xml["xr:TypeField"]),
    typesFilterField: extractFieldValue(characteristicTypes?.["xr:TypesFilterField"] || xml["xr:TypesFilterField"]),
    typesFilterValue: importMetadataValueFromXML(
      characteristicTypes?.["xr:TypesFilterValue"] || xml["xr:TypesFilterValue"],
      configurationSettings
    ),
    valueField: extractFieldValue(characteristicValues?.["xr:ValueField"] || xml["xr:ValueField"]),
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
