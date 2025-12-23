import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportMetadataAttributesToEnterprise } from "~/lib/metadata/commonObjects/metadataAttribute/exportToEnterprise"
import {
  MetadataTabularSection,
  MetadataTabularSectionEnterprise,
  MetadataTabularSections,
  MetadataTabularSectionsEnterprise,
} from "~/lib/metadata/commonObjects/metadataTabularSection/types"
import { exportStandardAttributeDescriptionsToEnterprise } from "~/lib/metadata/commonObjects/standardAttributeDescription/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { isSynonymEqualToName } from "~/lib/metadata/helpers/isSynonymEqualToName"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataTabularSectionToEnterprise = (
  context: Context,
  data: MetadataTabularSection | undefined
): MetadataTabularSectionEnterprise | undefined => {
  if (!data) return undefined

  let synonym = exportI8nTextToEnterprise(context, data.synonym)

  const excludeSynonym = isSynonymEqualToName(synonym, data.name)

  if (excludeSynonym) {
    synonym = undefined
  }

  return compactObject({
    Синоним: synonym,
    ДлинаНомераСтроки: data.lineNumberLength,
    Использование: exportSystemEnumerationToEnterprise(context, data.use, SE.AttributeUseToEnterprise),
    Комментарий: data.comment,
    Подсказка: exportI8nTextToEnterprise(context, data.tooltip),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      context,
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise
    ),
    ПроверкаЗаполнения: exportSystemEnumerationToEnterprise(context, data.fillChecking, SE.FillCheckingToEnterprise),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(context, data.standardAttributes),
    Реквизиты: exportMetadataAttributesToEnterprise(context, data.attributes),
  })
}

export const exportMetadataTabularSectionsToEnterprise = (
  context: Context,
  data: MetadataTabularSections | undefined
): MetadataTabularSectionsEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: MetadataTabularSection) => [value.name, exportMetadataTabularSectionToEnterprise(context, value)!])
  )
}
