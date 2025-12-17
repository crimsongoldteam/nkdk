import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportMetadataAttributesToEnterprise } from "~/lib/metadata/commonObjects/metadataAttribute/exportToEnterprise"
import {
  MetadataTabularSection,
  MetadataTabularSectionEnterprise,
  MetadataTabularSections,
  MetadataTabularSectionsEnterprise,
} from "~/lib/metadata/commonObjects/metadataTabularSection/types"
import { exportStandardAttributeDescriptionsToEnterprise } from "~/lib/metadata/commonObjects/standardAttributeDescription/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataTabularSectionToEnterprise = (
  data: MetadataTabularSection | undefined
): MetadataTabularSectionEnterprise | undefined => {
  if (!data) return undefined

  return {
    Реквизиты: exportMetadataAttributesToEnterprise(data.attributes),
    Комментарий: data.comment,
    ПроверкаЗаполнения: exportSystemEnumerationToEnterprise(data.fillChecking, SE.FillCheckingToEnterprise),
    ДлинаНомераСтроки: data.lineNumberLength,
    Имя: data.name,
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(data.objectBelonging, SE.ObjectBelongingToEnterprise),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(data.standardAttributes),
    Синоним: exportI8nTextToEnterprise(data.synonym),
    Подсказка: exportI8nTextToEnterprise(data.tooltip),
    Использование: exportSystemEnumerationToEnterprise(data.use, SE.AttributeUseToEnterprise),
  }
}

export const exportMetadataTabularSectionsToEnterprise = (
  data: MetadataTabularSections | undefined
): MetadataTabularSectionsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataTabularSection) => exportMetadataTabularSectionToEnterprise(value)!)
}
