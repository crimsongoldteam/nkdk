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
import { compactObject } from "~/lib/metadata/helpers/compactObject"

export const exportCharacteristicsDescriptionToEnterprise = (
  data: CharacteristicsDescription | undefined,
  configurationSettings: ConfigurationSettings
): CharacteristicsDescriptionEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ВидыХарактеристик: exportMetadataItemLinkToEnterprise(data.characteristicTypes, configurationSettings),
    ЗначениеОтбораВидов: exportMetadataValueToEnterprise(data.typesFilterValue, configurationSettings),
    ЗначенияХарактеристик: exportMetadataValueToEnterprise(data.characteristicValues, configurationSettings),
    ПолеВида: exportMetadataFieldToEnterprise(data.typeField, configurationSettings),
    ПолеЗначения: exportMetadataFieldToEnterprise(data.valueField, configurationSettings),
    ПолеИспользованияМножественныхЗначений: exportMetadataFieldToEnterprise(
      data.multipleValuesUseField,
      configurationSettings
    ),
    ПолеКлюча: exportMetadataFieldToEnterprise(data.keyField, configurationSettings),
    ПолеКлючаМножественныхЗначений: exportMetadataFieldToEnterprise(data.multipleValuesKeyField, configurationSettings),
    ПолеОбъекта: exportMetadataFieldToEnterprise(data.objectField, configurationSettings),
    ПолеОтбораВидов: exportMetadataFieldToEnterprise(data.typesFilterField, configurationSettings),
    ПолеПорядкаМножественныхЗначений: exportMetadataFieldToEnterprise(
      data.multipleValuesOrderField,
      configurationSettings
    ),
    ПолеПутиКДанным: exportMetadataFieldToEnterprise(data.dataPathField, configurationSettings),
  })
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
