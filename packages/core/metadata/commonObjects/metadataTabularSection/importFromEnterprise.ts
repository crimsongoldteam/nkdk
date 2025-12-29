import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importMetadataAttributesFromEnterprise } from "~/metadata/commonObjects/metadataAttribute/importFromEnterprise"
import {
  MetadataTabularSection,
  MetadataTabularSectionEnterprise,
  MetadataTabularSections,
  MetadataTabularSectionsEnterprise,
} from "~/metadata/commonObjects/metadataTabularSection/types"
import { importStandardAttributeDescriptionsFromEnterprise } from "~/metadata/commonObjects/standardAttributeDescription/importFromEnterprise"
import { Context } from "~/metadata/context/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importMetadataTabularSectionFromEnterprise = (
  context: Context,
  data: MetadataTabularSectionEnterprise | undefined,
  name: string
): MetadataTabularSection | undefined => {
  if (!data) return undefined

  return {
    name,
    synonym: importI8nTextFromEnterprise(context, data.Синоним),
    comment: data.Комментарий,
    fillChecking: importSystemEnumerationFromEnterprise(
      context,
      data.ПроверкаЗаполнения,
      SE.FillCheckingFromEnterprise
    ),
    lineNumberLength: data.ДлинаНомераСтроки,
    use: importSystemEnumerationFromEnterprise(context, data.Использование, SE.AttributeUseFromEnterprise),
    objectBelonging: importSystemEnumerationFromEnterprise(
      context,
      data.ПринадлежностьОбъекта,
      SE.ObjectBelongingFromEnterprise
    ),
    toolTip: importI8nTextFromEnterprise(context, data.Подсказка),
    standardAttributes: importStandardAttributeDescriptionsFromEnterprise(context, data.СтандартныеРеквизиты),
    attributes: importMetadataAttributesFromEnterprise(context, data.Реквизиты),
  }
}

export const importMetadataTabularSectionsFromEnterprise = (
  context: Context,
  data: MetadataTabularSectionsEnterprise | undefined
): MetadataTabularSections | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataTabularSectionFromEnterprise(context, value, name))
    .filter((item): item is MetadataTabularSection => item !== undefined)
}
