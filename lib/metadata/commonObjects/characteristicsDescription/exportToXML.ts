import {
  CharacteristicsDescription,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsXML,
  CharacteristicsDescriptionXML,
} from "~/lib/metadata/commonObjects/characteristicsDescription/types"
import { MetadataField } from "~/lib/metadata/commonObjects/metadataField/types"
import { exportMetadataValueToXML } from "~/lib/metadata/commonObjects/metadataValue/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

const exportFieldValue = (field: MetadataField | undefined, defaultValue: string = "-1"): string | undefined => {
  if (!field) return defaultValue
  return field
}

export const exportCharacteristicsDescriptionToXML = (
  configurationSettings: ConfigurationSettings,
  data: CharacteristicsDescription | undefined
): CharacteristicsDescriptionXML | undefined => {
  if (!data) return undefined

  const characteristicTypesData = compactObject({
    _from: data.characteristicTypes,
    "xr:KeyField": data.keyField || undefined,
    "xr:TypesFilterField": data.typesFilterField || undefined,
    "xr:TypesFilterValue": data.typesFilterValue
      ? exportMetadataValueToXML(configurationSettings, { type: "xs:string", value: data.typesFilterValue })
      : undefined,
    "xr:DataPathField": exportFieldValue(data.dataPathField),
    "xr:MultipleValuesUseField": exportFieldValue(data.multipleValuesUseField),
  })

  const hasCharacteristicValues =
    data.characteristicValues ||
    data.objectField ||
    data.typeField ||
    data.valueField ||
    data.multipleValuesKeyField ||
    data.multipleValuesOrderField

  const characteristicValuesData = hasCharacteristicValues
    ? compactObject({
        _from: data.characteristicValues,
        "xr:ObjectField": data.objectField || undefined,
        "xr:TypeField": data.typeField || undefined,
        "xr:ValueField": data.valueField || undefined,
        "xr:MultipleValuesKeyField": exportFieldValue(data.multipleValuesKeyField),
        "xr:MultipleValuesOrderField": exportFieldValue(data.multipleValuesOrderField),
      })
    : undefined

  return compactObject({
    "xr:CharacteristicTypes": characteristicTypesData,
    "xr:CharacteristicValues": characteristicValuesData,
  })
}

export const exportCharacteristicsDescriptionsToXML = (
  configurationSettings: ConfigurationSettings,
  data: CharacteristicsDescriptions | undefined
): CharacteristicsDescriptionsXML | undefined => {
  if (!data) return undefined

  return {
    "xr:Characteristic": data
      .map((value: CharacteristicsDescription) => exportCharacteristicsDescriptionToXML(configurationSettings, value))
      .filter((value): value is CharacteristicsDescriptionXML => value !== undefined),
  }
}
