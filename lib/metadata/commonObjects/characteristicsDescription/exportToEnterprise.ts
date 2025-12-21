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
  data: CharacteristicsDescription | undefined,
  configurationSettings: ConfigurationSettings
): CharacteristicsDescriptionEnterprise | undefined => {
  if (!data) return undefined

  const typesFilterValueMetadata: MetadataValue | undefined = data.typesFilterValue
    ? { type: "xs:string", value: data.typesFilterValue }
    : undefined

  const characteristicValuesMetadata: MetadataValue | undefined = data.characteristicValues
    ? { type: "xs:string", value: data.characteristicValues }
    : undefined

  return compactObject<CharacteristicsDescriptionEnterprise>({
    ВидыХарактеристик: exportMetadataItemLinkToEnterprise(data.characteristicTypes, configurationSettings),
    ЗначениеОтбораВидов: exportMetadataValueToEnterprise(typesFilterValueMetadata, configurationSettings),
    ЗначенияХарактеристик: exportMetadataValueToEnterprise(characteristicValuesMetadata, configurationSettings),
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
