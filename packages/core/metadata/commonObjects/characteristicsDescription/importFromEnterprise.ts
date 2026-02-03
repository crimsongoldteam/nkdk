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
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"

export const importCharacteristicsDescriptionFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: CharacteristicsDescriptionEnterprise | undefined
): CharacteristicsDescription | undefined => {
  if (!data) return undefined

  const result: CharacteristicsDescription = {} as CharacteristicsDescription

  const characteristicTypes = importMetadataItemLinkFromEnterprise(context, undefined, data.ВидыХарактеристик)
  if (characteristicTypes !== undefined) result.characteristicTypes = characteristicTypes

  const characteristicValues = importMetadataItemLinkFromEnterprise(context, undefined, data.ЗначенияХарактеристик)
  if (characteristicValues !== undefined) result.characteristicValues = characteristicValues

  const dataPathField = importMetadataFieldFromEnterprise(context, undefined, data.ПолеПутиКДанным)
  if (dataPathField !== undefined) result.dataPathField = dataPathField

  const keyField = importMetadataFieldFromEnterprise(context, undefined, data.ПолеКлюча)
  if (keyField !== undefined) result.keyField = keyField

  const multipleValuesKeyField = importMetadataFieldFromEnterprise(
    context,
    undefined,
    data.ПолеКлючаМножественныхЗначений
  )
  if (multipleValuesKeyField !== undefined) result.multipleValuesKeyField = multipleValuesKeyField

  const multipleValuesOrderField = importMetadataFieldFromEnterprise(
    context,
    undefined,
    data.ПолеПорядкаМножественныхЗначений
  )
  if (multipleValuesOrderField !== undefined) result.multipleValuesOrderField = multipleValuesOrderField

  const multipleValuesUseField = importMetadataFieldFromEnterprise(
    context,
    undefined,
    data.ПолеИспользованияМножественныхЗначений
  )
  if (multipleValuesUseField !== undefined) result.multipleValuesUseField = multipleValuesUseField

  const objectField = importMetadataFieldFromEnterprise(context, undefined, data.ПолеОбъекта)
  if (objectField !== undefined) result.objectField = objectField

  const typeField = importMetadataFieldFromEnterprise(context, undefined, data.ПолеВида)
  if (typeField !== undefined) result.typeField = typeField

  const typesFilterField = importMetadataFieldFromEnterprise(context, undefined, data.ПолеОтбораВидов)
  if (typesFilterField !== undefined) result.typesFilterField = typesFilterField

  const typesFilterValue = importMetadataValueFromEnterprise(context, undefined, data.ЗначениеОтбораВидов)
  if (typesFilterValue !== undefined) result.typesFilterValue = typesFilterValue

  const valueField = importMetadataFieldFromEnterprise(context, undefined, data.ПолеЗначения)
  if (valueField !== undefined) result.valueField = valueField

  return result
}

export const importCharacteristicsDescriptionsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: CharacteristicsDescriptionsEnterprise | undefined
): CharacteristicsDescriptions | undefined => {
  if (!data) return undefined

  return data
    .map(
      (value: CharacteristicsDescriptionEnterprise) =>
        importCharacteristicsDescriptionFromEnterprise(context, undefined, value)!
    )
    .filter((item): item is CharacteristicsDescription => item !== undefined)
}
