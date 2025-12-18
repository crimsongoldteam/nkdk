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
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataTabularSectionToEnterprise = (
  data: MetadataTabularSection | undefined,
  configurationSettings: ConfigurationSettings
): MetadataTabularSectionEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    Реквизиты: exportMetadataAttributesToEnterprise(data.attributes, configurationSettings),
    Комментарий: data.comment,
    ПроверкаЗаполнения: exportSystemEnumerationToEnterprise(
      data.fillChecking,
      SE.FillCheckingToEnterprise,
      configurationSettings
    ),
    ДлинаНомераСтроки: data.lineNumberLength,
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise,
      configurationSettings
    ),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(
      data.standardAttributes,
      configurationSettings
    ),
    Синоним: exportI8nTextToEnterprise(data.synonym, configurationSettings),
    Подсказка: exportI8nTextToEnterprise(data.tooltip, configurationSettings),
    Использование: exportSystemEnumerationToEnterprise(data.use, SE.AttributeUseToEnterprise, configurationSettings),
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
