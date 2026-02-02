import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importMetadataAttributesFromEnterprise } from "~/metadata/commonObjects/metadataAttribute/importFromEnterprise"
import {
  MetadataTabularSection,
  MetadataTabularSectionEnterprise,
  MetadataTabularSections,
  MetadataTabularSectionsEnterprise,
} from "~/metadata/commonObjects/metadataTabularSection/types"
import { importStandardAttributeDescriptionsFromEnterprise } from "~/metadata/commonObjects/standardAttributeDescription/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { getDefaults } from "./defaults"

export const importMetadataTabularSectionFromEnterprise = (
  context: ConfigurationContext,
  data: MetadataTabularSectionEnterprise | undefined,
  name: string
): MetadataTabularSection | undefined => {
  if (!data) return undefined

  const result: MetadataTabularSection = {
    name,
    synonym: addDefaultLanguageNameToSynonym(context, importI8nTextFromEnterprise(context, data.Синоним), name),
  }

  if (data.Комментарий !== undefined) result.comment = data.Комментарий

  const fillChecking = importSystemEnumerationFromYAML<SE.FillChecking>(
    context,
    data.ПроверкаЗаполнения,
    SE.FillCheckingFromEnterprise
  )
  if (fillChecking !== undefined) result.fillChecking = fillChecking

  if (data.ДлинаНомераСтроки !== undefined) result.lineNumberLength = data.ДлинаНомераСтроки

  const use = importSystemEnumerationFromYAML<SE.AttributeUse>(
    context,
    data.Использование,
    SE.AttributeUseFromEnterprise
  )
  if (use !== undefined) result.use = use

  // const objectBelonging = importSystemEnumerationFromEnterprise(
  //   context,
  //   data.ПринадлежностьОбъекта,
  //   SE.ObjectBelongingFromEnterprise
  // )
  // if (objectBelonging !== undefined) result.objectBelonging = objectBelonging

  const toolTip = importI8nTextFromEnterprise(context, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const standardAttributes = importStandardAttributeDescriptionsFromEnterprise(context, data.СтандартныеРеквизиты)
  if (standardAttributes !== undefined) result.standardAttributes = standardAttributes

  const attributes = importMetadataAttributesFromEnterprise(context, data.Реквизиты)
  if (attributes !== undefined) result.attributes = attributes

  const defaults = getDefaults(context, result)
  return removeDefaults(result, defaults)
}

export const importMetadataTabularSectionsFromEnterprise = (
  context: ConfigurationContext,
  data: MetadataTabularSectionsEnterprise | undefined
): MetadataTabularSections | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataTabularSectionFromEnterprise(context, value, name))
    .filter((item): item is MetadataTabularSection => item !== undefined)
}
