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
import { compactObject } from "~/metadata/helpers/compactObject"

export const importCharacteristicsDescriptionFromEnterprise = (
  context: ConfigurationContext,
  data: CharacteristicsDescriptionEnterprise | undefined
): CharacteristicsDescription | undefined => {
  if (!data) return undefined

  return compactObject<CharacteristicsDescription>({
    characteristicTypes: importMetadataItemLinkFromEnterprise(context, data.ВидыХарактеристик),
    characteristicValues: importMetadataItemLinkFromEnterprise(context, data.ЗначенияХарактеристик),
    dataPathField: importMetadataFieldFromEnterprise(context, data.ПолеПутиКДанным),
    keyField: importMetadataFieldFromEnterprise(context, data.ПолеКлюча),
    multipleValuesKeyField: importMetadataFieldFromEnterprise(context, data.ПолеКлючаМножественныхЗначений),
    multipleValuesOrderField: importMetadataFieldFromEnterprise(context, data.ПолеПорядкаМножественныхЗначений),
    multipleValuesUseField: importMetadataFieldFromEnterprise(context, data.ПолеИспользованияМножественныхЗначений),
    objectField: importMetadataFieldFromEnterprise(context, data.ПолеОбъекта),
    typeField: importMetadataFieldFromEnterprise(context, data.ПолеВида),
    typesFilterField: importMetadataFieldFromEnterprise(context, data.ПолеОтбораВидов),
    typesFilterValue: importMetadataValueFromEnterprise(context, data.ЗначениеОтбораВидов),
    valueField: importMetadataFieldFromEnterprise(context, data.ПолеЗначения),
  })
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
