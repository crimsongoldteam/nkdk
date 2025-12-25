import {
  CharacteristicsDescription,
  CharacteristicsDescriptionEnterprise,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsEnterprise,
} from "~/lib/metadata/commonObjects/characteristicsDescription/types"
import { exportMetadataFieldToEnterprise } from "~/lib/metadata/commonObjects/metadataField/exportToEnterprise"
import { exportMetadataItemLinkToEnterprise } from "~/lib/metadata/commonObjects/metadataRef/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportMetadataValueToEnterprise } from "../metadataValue/exportToEnterprise"
import { MetadataValue } from "../metadataValue/types"

export const exportCharacteristicsDescriptionToEnterprise = (
  context: Context,
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
    ВидыХарактеристик: exportMetadataItemLinkToEnterprise(context, data.characteristicTypes),
    ЗначениеОтбораВидов: exportMetadataValueToEnterprise(context, typesFilterValueMetadata),
    ЗначенияХарактеристик: exportMetadataValueToEnterprise(context, characteristicValuesMetadata),
    ПолеВида: exportMetadataFieldToEnterprise(context, data.typeField),
    ПолеЗначения: exportMetadataFieldToEnterprise(context, data.valueField),
    ПолеИспользованияМножественныхЗначений: exportMetadataFieldToEnterprise(context, data.multipleValuesUseField),
    ПолеКлюча: exportMetadataFieldToEnterprise(context, data.keyField),
    ПолеКлючаМножественныхЗначений: exportMetadataFieldToEnterprise(context, data.multipleValuesKeyField),
    ПолеОбъекта: exportMetadataFieldToEnterprise(context, data.objectField),
    ПолеОтбораВидов: exportMetadataFieldToEnterprise(context, data.typesFilterField),
    ПолеПорядкаМножественныхЗначений: exportMetadataFieldToEnterprise(context, data.multipleValuesOrderField),
    ПолеПутиКДанным: exportMetadataFieldToEnterprise(context, data.dataPathField),
  })
}

export const exportCharacteristicsDescriptionsToEnterprise = (
  context: Context,
  data: CharacteristicsDescriptions | undefined
): CharacteristicsDescriptionsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((value: CharacteristicsDescription) => exportCharacteristicsDescriptionToEnterprise(context, value)!)
}
