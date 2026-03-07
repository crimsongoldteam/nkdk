import {
  CharacteristicsDescription,
  CharacteristicsDescriptionYAML,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsYAML,
} from "~/metadata/commonObjects/characteristicsDescription/types"
import { importMetadataFieldFromYAML } from "~/metadata/commonObjects/metadataField/fromYAML"
import { importMetadataItemLinkFromYAML } from "~/metadata/commonObjects/metadataRef/fromYAML"
import { importMetadataValueFromYAML } from "~/metadata/commonObjects/metadataValue/fromYAML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration"

export const importCharacteristicsDescriptionFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: CharacteristicsDescriptionYAML | undefined
): CharacteristicsDescription | undefined => {
  if (!data) return undefined

  const result: CharacteristicsDescription = {} as CharacteristicsDescription

  const characteristicTypes = importMetadataItemLinkFromYAML(context, undefined, data.ВидыХарактеристик)
  if (characteristicTypes !== undefined) result.characteristicTypes = characteristicTypes

  const characteristicValues = importMetadataItemLinkFromYAML(context, undefined, data.ЗначенияХарактеристик)
  if (characteristicValues !== undefined) result.characteristicValues = characteristicValues

  const dataPathField = importMetadataFieldFromYAML(context, undefined, data.ПолеПутиКДанным)
  if (dataPathField !== undefined) result.dataPathField = dataPathField

  const keyField = importMetadataFieldFromYAML(context, undefined, data.ПолеКлюча)
  if (keyField !== undefined) result.keyField = keyField

  const multipleValuesKeyField = importMetadataFieldFromYAML(context, undefined, data.ПолеКлючаМножественныхЗначений)
  if (multipleValuesKeyField !== undefined) result.multipleValuesKeyField = multipleValuesKeyField

  const multipleValuesOrderField = importMetadataFieldFromYAML(
    context,
    undefined,
    data.ПолеПорядкаМножественныхЗначений
  )
  if (multipleValuesOrderField !== undefined) result.multipleValuesOrderField = multipleValuesOrderField

  const multipleValuesUseField = importMetadataFieldFromYAML(
    context,
    undefined,
    data.ПолеИспользованияМножественныхЗначений
  )
  if (multipleValuesUseField !== undefined) result.multipleValuesUseField = multipleValuesUseField

  const objectField = importMetadataFieldFromYAML(context, undefined, data.ПолеОбъекта)
  if (objectField !== undefined) result.objectField = objectField

  const typeField = importMetadataFieldFromYAML(context, undefined, data.ПолеВида)
  if (typeField !== undefined) result.typeField = typeField

  const typesFilterField = importMetadataFieldFromYAML(context, undefined, data.ПолеОтбораВидов)
  if (typesFilterField !== undefined) result.typesFilterField = typesFilterField

  const typesFilterValue = importMetadataValueFromYAML(context, undefined, data.ЗначениеОтбораВидов)
  if (typesFilterValue !== undefined) result.typesFilterValue = typesFilterValue

  const valueField = importMetadataFieldFromYAML(context, undefined, data.ПолеЗначения)
  if (valueField !== undefined) result.valueField = valueField

  return result
}

export const importCharacteristicsDescriptionsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: CharacteristicsDescriptionsYAML | undefined
): CharacteristicsDescriptions | undefined => {
  if (!data) return undefined

  return data
    .map(
      (value: CharacteristicsDescriptionYAML) => importCharacteristicsDescriptionFromYAML(context, undefined, value)!
    )
    .filter((item): item is CharacteristicsDescription => item !== undefined)
}

registerTypeRule("CharacteristicsDescription", "importFromYAML", importCharacteristicsDescriptionsFromYAML)
