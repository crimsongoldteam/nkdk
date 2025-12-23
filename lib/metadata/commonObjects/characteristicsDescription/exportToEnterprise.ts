import {
  CharacteristicsDescription,
  CharacteristicsDescriptionEnterprise,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsEnterprise,
} from "~/lib/metadata/commonObjects/characteristicsDescription/types"
import { exportMetadataFieldToEnterprise } from "~/lib/metadata/commonObjects/metadataField/exportToEnterprise"
import { exportMetadataItemLinkToEnterprise } from "~/lib/metadata/commonObjects/metadataItemLink/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportMetadataValueToEnterprise } from "../metadataValue/exportToEnterprise"
import { MetadataValue } from "../metadataValue/types"

export const exportCharacteristicsDescriptionToEnterprise = (
  configurationSettings: ConfigurationSettings,
  data: CharacteristicsDescription | undefined
): CharacteristicsDescriptionEnterprise | undefined => {
  if (!data) return undefined

  const typesFilterValueMetadata: MetadataValue | undefined = data.typesFilterValue
    ? { type: "xs:string", value: data.typesFilterValue }
    : undefined

  const characteristicValuesMetadata: MetadataValue | undefined = data.characteristicValues
    ? { type: "xs:string", value: data.characteristicValues }
    : undefined

  return compactObject<CharacteristicsDescriptionEnterprise>({
    ВидыХарактеристик: exportMetadataItemLinkToEnterprise(configurationSettings, data.characteristicTypes),
    ЗначениеОтбораВидов: exportMetadataValueToEnterprise(configurationSettings, typesFilterValueMetadata),
    ЗначенияХарактеристик: exportMetadataValueToEnterprise(configurationSettings, characteristicValuesMetadata),
    ПолеВида: exportMetadataFieldToEnterprise(configurationSettings, data.typeField),
    ПолеЗначения: exportMetadataFieldToEnterprise(configurationSettings, data.valueField),
    ПолеИспользованияМножественныхЗначений: exportMetadataFieldToEnterprise(
      configurationSettings,
      data.multipleValuesUseField
    ),
    ПолеКлюча: exportMetadataFieldToEnterprise(configurationSettings, data.keyField),
    ПолеКлючаМножественныхЗначений: exportMetadataFieldToEnterprise(configurationSettings, data.multipleValuesKeyField),
    ПолеОбъекта: exportMetadataFieldToEnterprise(configurationSettings, data.objectField),
    ПолеОтбораВидов: exportMetadataFieldToEnterprise(configurationSettings, data.typesFilterField),
    ПолеПорядкаМножественныхЗначений: exportMetadataFieldToEnterprise(
      configurationSettings,
      data.multipleValuesOrderField
    ),
    ПолеПутиКДанным: exportMetadataFieldToEnterprise(configurationSettings, data.dataPathField),
  })
}

export const exportCharacteristicsDescriptionsToEnterprise = (
  configurationSettings: ConfigurationSettings,
  data: CharacteristicsDescriptions | undefined
): CharacteristicsDescriptionsEnterprise | undefined => {
  if (!data) return undefined

  return data.map(
    (value: CharacteristicsDescription) => exportCharacteristicsDescriptionToEnterprise(configurationSettings, value)!
  )
}
