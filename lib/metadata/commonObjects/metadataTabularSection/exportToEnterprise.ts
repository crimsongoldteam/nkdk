import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportMetadataAttributesToEnterprise } from "~/lib/metadata/commonObjects/metadataAttribute/exportToEnterprise"
import {
  MetadataTabularSection,
  MetadataTabularSectionEnterprise,
  MetadataTabularSections,
  MetadataTabularSectionsEnterprise,
} from "~/lib/metadata/commonObjects/metadataTabularSection/types"
import { exportStandardAttributeDescriptionsToEnterprise } from "~/lib/metadata/commonObjects/standardAttributeDescription/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { isSynonymEqualToName } from "~/lib/metadata/helpers/isSynonymEqualToName"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataTabularSectionToEnterprise = (
  data: MetadataTabularSection | undefined,
  configurationSettings: ConfigurationSettings
): MetadataTabularSectionEnterprise | undefined => {
  if (!data) return undefined

  let synonym = exportI8nTextToEnterprise(data.synonym, configurationSettings)

  const excludeSynonym = isSynonymEqualToName(synonym, data.name)

  if (excludeSynonym) {
    synonym = undefined
  }

  return compactObject({
    Синоним: synonym,
    ДлинаНомераСтроки: data.lineNumberLength,
    Использование: exportSystemEnumerationToEnterprise(data.use, SE.AttributeUseToEnterprise, configurationSettings),
    Комментарий: data.comment,
    Подсказка: exportI8nTextToEnterprise(data.tooltip, configurationSettings),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise,
      configurationSettings
    ),
    ПроверкаЗаполнения: exportSystemEnumerationToEnterprise(
      data.fillChecking,
      SE.FillCheckingToEnterprise,
      configurationSettings
    ),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(
      data.standardAttributes,
      configurationSettings
    ),
    Реквизиты: exportMetadataAttributesToEnterprise(data.attributes, configurationSettings),
  })
}

export const exportMetadataTabularSectionsToEnterprise = (
  data: MetadataTabularSections | undefined,
  configurationSettings: ConfigurationSettings
): MetadataTabularSectionsEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: MetadataTabularSection) => [
      value.name,
      exportMetadataTabularSectionToEnterprise(value, configurationSettings)!,
    ])
  )
}
