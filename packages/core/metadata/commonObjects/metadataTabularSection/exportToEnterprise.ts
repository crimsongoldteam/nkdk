import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportMetadataAttributesToEnterprise } from "~/metadata/commonObjects/metadataAttribute/exportToEnterprise"
import {
  MetadataTabularSection,
  MetadataTabularSectionEnterprise,
  MetadataTabularSections,
  MetadataTabularSectionsEnterprise,
} from "~/metadata/commonObjects/metadataTabularSection/types"
import { exportStandardAttributeDescriptionsToEnterprise } from "~/metadata/commonObjects/standardAttributeDescription/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { extractDifferentSynonymPart } from "~/metadata/helpers/synonymHelpers"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportMetadataTabularSectionToEnterprise = (
  context: ConfigurationContext,
  data: MetadataTabularSection | undefined
): MetadataTabularSectionEnterprise | undefined => {
  if (!data) return undefined

  const filteredSynonym = extractDifferentSynonymPart(context, data.synonym, data.name)
  const synonym = exportI8nTextToEnterprise(context, filteredSynonym)

  const result: MetadataTabularSectionEnterprise = {}

  if (synonym !== undefined) result.Синоним = synonym

  if (data.lineNumberLength !== undefined) result.ДлинаНомераСтроки = data.lineNumberLength

  const use = exportSystemEnumerationToEnterprise(
    context,
    data.use,
    SE.AttributeUseToEnterprise
  )
  if (use !== undefined) result.Использование = use

  if (data.comment !== undefined) result.Комментарий = data.comment

  const toolTip = exportI8nTextToEnterprise(context, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const objectBelonging = exportSystemEnumerationToEnterprise(
    context,
    data.objectBelonging,
    SE.ObjectBelongingToEnterprise
  )
  if (objectBelonging !== undefined) result.ПринадлежностьОбъекта = objectBelonging

  const fillChecking = exportSystemEnumerationToEnterprise(
    context,
    data.fillChecking,
    SE.FillCheckingToEnterprise
  )
  if (fillChecking !== undefined) result.ПроверкаЗаполнения = fillChecking

  const standardAttributes = exportStandardAttributeDescriptionsToEnterprise(context, data.standardAttributes)
  if (standardAttributes !== undefined) result.СтандартныеРеквизиты = standardAttributes

  const attributes = exportMetadataAttributesToEnterprise(context, data.attributes)
  if (attributes !== undefined) result.Реквизиты = attributes

  return result
}

export const exportMetadataTabularSectionsToEnterprise = (
  context: ConfigurationContext,
  data: MetadataTabularSections | undefined
): MetadataTabularSectionsEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: MetadataTabularSection) => [value.name, exportMetadataTabularSectionToEnterprise(context, value)!])
  )
}
