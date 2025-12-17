import {
  CharacteristicsDescription,
  CharacteristicsDescriptionEnterprise,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsEnterprise,
} from "~/lib/metadata/commonObjects/characteristicsDescription/types"
import { exportMetadataFieldToEnterprise } from "~/lib/metadata/commonObjects/metadataField/exportToEnterprise"
import { exportMetadataItemLinkToEnterprise } from "~/lib/metadata/commonObjects/metadataItemLink/exportToEnterprise"
import { exportMetadataValueToEnterprise } from "~/lib/metadata/commonObjects/metadataValue/exportToEnterprise"

export const exportCharacteristicsDescriptionToEnterprise = (
  data: CharacteristicsDescription | undefined
): CharacteristicsDescriptionEnterprise | undefined => {
  if (!data) return undefined

  return {
    ВидыХарактеристик: exportMetadataItemLinkToEnterprise(data.characteristicTypes),
    ЗначенияХарактеристик: exportMetadataValueToEnterprise(data.characteristicValues),
    ПолеПутиКДанным: exportMetadataFieldToEnterprise(data.dataPathField),
    ПолеКлюча: exportMetadataFieldToEnterprise(data.keyField),
    ПолеКлючаМножественныхЗначений: exportMetadataFieldToEnterprise(data.multipleValuesKeyField),
    ПолеПорядкаМножественныхЗначений: exportMetadataFieldToEnterprise(data.multipleValuesOrderField),
    ПолеИспользованияМножественныхЗначений: exportMetadataFieldToEnterprise(data.multipleValuesUseField),
    ПолеОбъекта: exportMetadataFieldToEnterprise(data.objectField),
    ПолеВида: exportMetadataFieldToEnterprise(data.typeField),
    ПолеОтбораВидов: exportMetadataFieldToEnterprise(data.typesFilterField),
    ЗначениеОтбораВидов: exportMetadataValueToEnterprise(data.typesFilterValue),
    ПолеЗначения: exportMetadataFieldToEnterprise(data.valueField),
  }
}

export const exportCharacteristicsDescriptionsToEnterprise = (
  data: CharacteristicsDescriptions | undefined
): CharacteristicsDescriptionsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((value: CharacteristicsDescription) => exportCharacteristicsDescriptionToEnterprise(value)!)
}
