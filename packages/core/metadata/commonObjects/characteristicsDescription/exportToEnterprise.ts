import {
  CharacteristicsDescription,
  CharacteristicsDescriptionYAML,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsYAML,
} from "~/metadata/commonObjects/characteristicsDescription/types"
import { exportMetadataFieldToYAML } from "~/metadata/commonObjects/metadataField/toYAML"
import { exportMetadataItemLinkToYAML } from "~/metadata/commonObjects/metadataRef/toYAML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { exportMetadataValueToYAML } from "../metadataValue/toYAML"

export const exportCharacteristicsDescriptionToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: CharacteristicsDescription | undefined
): CharacteristicsDescriptionYAML | undefined => {
  if (!data) return undefined

  const result: CharacteristicsDescriptionYAML = {}

  if (data.characteristicTypes) {
    result.ВидыХарактеристик = exportMetadataItemLinkToYAML(context, undefined, data.characteristicTypes)
  }

  if (data.typesFilterValue) {
    result.ЗначениеОтбораВидов = exportMetadataValueToYAML(context, undefined, data.typesFilterValue)
  }

  if (data.characteristicValues) {
    result.ЗначенияХарактеристик = exportMetadataItemLinkToYAML(context, undefined, data.characteristicValues)
  }

  if (data.typeField) {
    result.ПолеВида = exportMetadataFieldToYAML(context, undefined, data.typeField)
  }

  if (data.valueField) {
    result.ПолеЗначения = exportMetadataFieldToYAML(context, undefined, data.valueField)
  }

  if (data.multipleValuesUseField) {
    result.ПолеИспользованияМножественныхЗначений = exportMetadataFieldToYAML(
      context,
      undefined,
      data.multipleValuesUseField
    )
  }

  if (data.keyField) {
    result.ПолеКлюча = exportMetadataFieldToYAML(context, undefined, data.keyField)
  }

  if (data.multipleValuesKeyField) {
    result.ПолеКлючаМножественныхЗначений = exportMetadataFieldToYAML(context, undefined, data.multipleValuesKeyField)
  }

  if (data.objectField) {
    result.ПолеОбъекта = exportMetadataFieldToYAML(context, undefined, data.objectField)
  }

  if (data.typesFilterField) {
    result.ПолеОтбораВидов = exportMetadataFieldToYAML(context, undefined, data.typesFilterField)
  }

  if (data.multipleValuesOrderField) {
    result.ПолеПорядкаМножественныхЗначений = exportMetadataFieldToYAML(
      context,
      undefined,
      data.multipleValuesOrderField
    )
  }

  if (data.dataPathField) {
    result.ПолеПутиКДанным = exportMetadataFieldToYAML(context, undefined, data.dataPathField)
  }

  return result
}

export const exportCharacteristicsDescriptionsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: CharacteristicsDescriptions | undefined
): CharacteristicsDescriptionsYAML | undefined => {
  if (!data) return undefined

  return data.map(
    (value: CharacteristicsDescription) => exportCharacteristicsDescriptionToYAML(context, undefined, value)!
  )
}

registerTypeRule("CharacteristicsDescription", "exportToYAML", exportCharacteristicsDescriptionsToYAML)
