import {
  CharacteristicsDescription,
  CharacteristicsDescriptionEnterprise,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsEnterprise,
} from "~/lib/metadata/commonObjects/characteristicsDescription/types"
import { exportMetadataFieldToEnterprise } from "~/lib/metadata/commonObjects/metadataField/exportToEnterprise"
import { exportMetadataItemLinkToEnterprise } from "~/lib/metadata/commonObjects/metadataItemLink/exportToEnterprise"
import { exportMetadataValueToEnterprise } from "~/lib/metadata/commonObjects/metadataValue/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const exportCharacteristicsDescriptionToEnterprise = (
  data: CharacteristicsDescription | undefined,
  configurationSettings: ConfigurationSettings
): CharacteristicsDescriptionEnterprise | undefined => {
  if (!data) return undefined

  return {
    ВидыХарактеристик: exportMetadataItemLinkToEnterprise(data.characteristicTypes, configurationSettings),
    ЗначенияХарактеристик: exportMetadataValueToEnterprise(data.characteristicValues, configurationSettings),
    ПолеПутиКДанным: exportMetadataFieldToEnterprise(data.dataPathField, configurationSettings),
    ПолеКлюча: exportMetadataFieldToEnterprise(data.keyField, configurationSettings),
    ПолеКлючаМножественныхЗначений: exportMetadataFieldToEnterprise(data.multipleValuesKeyField, configurationSettings),
    ПолеПорядкаМножественныхЗначений: exportMetadataFieldToEnterprise(
      data.multipleValuesOrderField,
      configurationSettings
    ),
    ПолеИспользованияМножественныхЗначений: exportMetadataFieldToEnterprise(
      data.multipleValuesUseField,
      configurationSettings
    ),
    ПолеОбъекта: exportMetadataFieldToEnterprise(data.objectField, configurationSettings),
    ПолеВида: exportMetadataFieldToEnterprise(data.typeField, configurationSettings),
    ПолеОтбораВидов: exportMetadataFieldToEnterprise(data.typesFilterField, configurationSettings),
    ЗначениеОтбораВидов: exportMetadataValueToEnterprise(data.typesFilterValue, configurationSettings),
    ПолеЗначения: exportMetadataFieldToEnterprise(data.valueField, configurationSettings),
  }
}

export const exportCharacteristicsDescriptionsToEnterprise = (
  data: CharacteristicsDescriptions | undefined,
  configurationSettings: ConfigurationSettings
): CharacteristicsDescriptionsEnterprise | undefined => {
  if (!data) return undefined

  return data.map(
    (value: CharacteristicsDescription) => exportCharacteristicsDescriptionToEnterprise(value, configurationSettings)!
  )
}
