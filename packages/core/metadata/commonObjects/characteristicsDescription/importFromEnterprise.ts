import {
  CharacteristicsDescription,
  CharacteristicsDescriptionEnterprise,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsEnterprise,
} from "~/metadata/commonObjects/characteristicsDescription/types"
import { importMetadataFieldFromEnterprise } from "~/metadata/commonObjects/metadataField/importFromEnterprise"
import { importMetadataItemLinkFromEnterprise } from "~/metadata/commonObjects/metadataRef/importFromEnterprise"
import { importMetadataValueFromEnterprise } from "~/metadata/commonObjects/metadataValue/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"

export const importCharacteristicsDescriptionFromEnterprise = (
  context: ConfigurationContext,
  data: CharacteristicsDescriptionEnterprise | undefined
): CharacteristicsDescription | undefined => {
  if (!data) return undefined

  const result: CharacteristicsDescription = {} as CharacteristicsDescription

  const characteristicTypes = importMetadataItemLinkFromEnterprise(context, data.ВидыХарактеристик)
  if (characteristicTypes !== undefined) result.characteristicTypes = characteristicTypes

  const characteristicValues = importMetadataItemLinkFromEnterprise(context, data.ЗначенияХарактеристик)
  if (characteristicValues !== undefined) result.characteristicValues = characteristicValues

  const dataPathField = importMetadataFieldFromEnterprise(context, data.ПолеПутиКДанным)
  if (dataPathField !== undefined) result.dataPathField = dataPathField

  const keyField = importMetadataFieldFromEnterprise(context, data.ПолеКлюча)
  if (keyField !== undefined) result.keyField = keyField

  const multipleValuesKeyField = importMetadataFieldFromEnterprise(context, data.ПолеКлючаМножественныхЗначений)
  if (multipleValuesKeyField !== undefined) result.multipleValuesKeyField = multipleValuesKeyField

  const multipleValuesOrderField = importMetadataFieldFromEnterprise(context, data.ПолеПорядкаМножественныхЗначений)
  if (multipleValuesOrderField !== undefined) result.multipleValuesOrderField = multipleValuesOrderField

  const multipleValuesUseField = importMetadataFieldFromEnterprise(context, data.ПолеИспользованияМножественныхЗначений)
  if (multipleValuesUseField !== undefined) result.multipleValuesUseField = multipleValuesUseField

  const objectField = importMetadataFieldFromEnterprise(context, data.ПолеОбъекта)
  if (objectField !== undefined) result.objectField = objectField

  const typeField = importMetadataFieldFromEnterprise(context, data.ПолеВида)
  if (typeField !== undefined) result.typeField = typeField

  const typesFilterField = importMetadataFieldFromEnterprise(context, data.ПолеОтбораВидов)
  if (typesFilterField !== undefined) result.typesFilterField = typesFilterField

  const typesFilterValue = importMetadataValueFromEnterprise(context, data.ЗначениеОтбораВидов)
  if (typesFilterValue !== undefined) result.typesFilterValue = typesFilterValue

  const valueField = importMetadataFieldFromEnterprise(context, data.ПолеЗначения)
  if (valueField !== undefined) result.valueField = valueField

  return result
}

export const importCharacteristicsDescriptionsFromEnterprise = (
  context: ConfigurationContext,
  data: CharacteristicsDescriptionsEnterprise | undefined
): CharacteristicsDescriptions | undefined => {
  if (!data) return undefined

  return data
    .map(
      (value: CharacteristicsDescriptionEnterprise) => importCharacteristicsDescriptionFromEnterprise(context, value)!
    )
    .filter((item): item is CharacteristicsDescription => item !== undefined)
}
