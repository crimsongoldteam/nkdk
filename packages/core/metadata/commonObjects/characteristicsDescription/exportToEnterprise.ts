import {
  CharacteristicsDescription,
  CharacteristicsDescriptionEnterprise,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsEnterprise,
} from "~/metadata/commonObjects/characteristicsDescription/types"
import { exportMetadataFieldToEnterprise } from "~/metadata/commonObjects/metadataField/exportToEnterprise"
import { exportMetadataItemLinkToEnterprise } from "~/metadata/commonObjects/metadataRef/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportMetadataValueToEnterprise } from "../metadataValue/exportToEnterprise"

export const exportCharacteristicsDescriptionToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: CharacteristicsDescription | undefined
): CharacteristicsDescriptionEnterprise | undefined => {
  if (!data) return undefined

  const result: CharacteristicsDescriptionEnterprise = {}

  if (data.characteristicTypes) {
    result.ВидыХарактеристик = exportMetadataItemLinkToEnterprise(context, undefined, data.characteristicTypes)
  }

  if (data.typesFilterValue) {
    result.ЗначениеОтбораВидов = exportMetadataValueToEnterprise(context, undefined, data.typesFilterValue)
  }

  if (data.characteristicValues) {
    result.ЗначенияХарактеристик = exportMetadataItemLinkToEnterprise(context, undefined, data.characteristicValues)
  }

  if (data.typeField) {
    result.ПолеВида = exportMetadataFieldToEnterprise(context, undefined, data.typeField)
  }

  if (data.valueField) {
    result.ПолеЗначения = exportMetadataFieldToEnterprise(context, undefined, data.valueField)
  }

  if (data.multipleValuesUseField) {
    result.ПолеИспользованияМножественныхЗначений = exportMetadataFieldToEnterprise(
      context,
      undefined,
      data.multipleValuesUseField
    )
  }

  if (data.keyField) {
    result.ПолеКлюча = exportMetadataFieldToEnterprise(context, undefined, data.keyField)
  }

  if (data.multipleValuesKeyField) {
    result.ПолеКлючаМножественныхЗначений = exportMetadataFieldToEnterprise(
      context,
      undefined,
      data.multipleValuesKeyField
    )
  }

  if (data.objectField) {
    result.ПолеОбъекта = exportMetadataFieldToEnterprise(context, undefined, data.objectField)
  }

  if (data.typesFilterField) {
    result.ПолеОтбораВидов = exportMetadataFieldToEnterprise(context, undefined, data.typesFilterField)
  }

  if (data.multipleValuesOrderField) {
    result.ПолеПорядкаМножественныхЗначений = exportMetadataFieldToEnterprise(
      context,
      undefined,
      data.multipleValuesOrderField
    )
  }

  if (data.dataPathField) {
    result.ПолеПутиКДанным = exportMetadataFieldToEnterprise(context, undefined, data.dataPathField)
  }

  return result
}

export const exportCharacteristicsDescriptionsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: CharacteristicsDescriptions | undefined
): CharacteristicsDescriptionsEnterprise | undefined => {
  if (!data) return undefined

  return data.map(
    (value: CharacteristicsDescription) => exportCharacteristicsDescriptionToEnterprise(context, undefined, value)!
  )
}
