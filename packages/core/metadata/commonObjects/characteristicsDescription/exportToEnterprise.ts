import {
  CharacteristicsDescription,
  CharacteristicsDescriptionEnterprise,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsEnterprise,
} from "~/metadata/commonObjects/characteristicsDescription/types"
import { exportMetadataFieldToEnterprise } from "~/metadata/commonObjects/metadataField/exportToEnterprise"
import { exportMetadataItemLinkToEnterprise } from "~/metadata/commonObjects/metadataRef/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataValueToEnterprise } from "../metadataValue/exportToEnterprise"

export const exportCharacteristicsDescriptionToEnterprise = (
  context: ConfigurationContext,
  data: CharacteristicsDescription | undefined
): CharacteristicsDescriptionEnterprise | undefined => {
  if (!data) return undefined

  const result: CharacteristicsDescriptionEnterprise = {}

  if (data.characteristicTypes) {
    result.ВидыХарактеристик = exportMetadataItemLinkToEnterprise(context, data.characteristicTypes)
  }

  if (data.typesFilterValue) {
    result.ЗначениеОтбораВидов = exportMetadataValueToEnterprise(context, data.typesFilterValue)
  }

  if (data.characteristicValues) {
    result.ЗначенияХарактеристик = exportMetadataItemLinkToEnterprise(context, data.characteristicValues)
  }

  if (data.typeField) {
    result.ПолеВида = exportMetadataFieldToEnterprise(context, data.typeField)
  }

  if (data.valueField) {
    result.ПолеЗначения = exportMetadataFieldToEnterprise(context, data.valueField)
  }

  if (data.multipleValuesUseField) {
    result.ПолеИспользованияМножественныхЗначений = exportMetadataFieldToEnterprise(
      context,
      data.multipleValuesUseField
    )
  }

  if (data.keyField) {
    result.ПолеКлюча = exportMetadataFieldToEnterprise(context, data.keyField)
  }

  if (data.multipleValuesKeyField) {
    result.ПолеКлючаМножественныхЗначений = exportMetadataFieldToEnterprise(context, data.multipleValuesKeyField)
  }

  if (data.objectField) {
    result.ПолеОбъекта = exportMetadataFieldToEnterprise(context, data.objectField)
  }

  if (data.typesFilterField) {
    result.ПолеОтбораВидов = exportMetadataFieldToEnterprise(context, data.typesFilterField)
  }

  if (data.multipleValuesOrderField) {
    result.ПолеПорядкаМножественныхЗначений = exportMetadataFieldToEnterprise(context, data.multipleValuesOrderField)
  }

  if (data.dataPathField) {
    result.ПолеПутиКДанным = exportMetadataFieldToEnterprise(context, data.dataPathField)
  }

  return result
}

export const exportCharacteristicsDescriptionsToEnterprise = (
  context: ConfigurationContext,
  data: CharacteristicsDescriptions | undefined
): CharacteristicsDescriptionsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((value: CharacteristicsDescription) => exportCharacteristicsDescriptionToEnterprise(context, value)!)
}
