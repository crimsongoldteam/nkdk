import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportMetadataAttributesToEnterprise } from "~/metadata/commonObjects/metadataAttribute/exportToEnterprise"
import {
  MetadataTabularSection,
  MetadataTabularSectionEnterprise,
  MetadataTabularSections,
  MetadataTabularSectionsEnterprise,
} from "~/metadata/commonObjects/metadataTabularSection/types"
import { exportStandardAttributeDescriptionsToEnterprise } from "~/metadata/commonObjects/standardAttributeDescription/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { isSynonymEqualToName } from "~/metadata/helpers/isSynonymEqualToName"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

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
    Подсказка: exportI8nTextToEnterprise(context, data.toolTip),
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
