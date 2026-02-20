import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { exportMetadataAttributesToYAML } from "~/metadata/commonObjects/metadataAttribute/toYAML"
import {
  MetadataTabularSection,
  MetadataTabularSectionYAML,
  MetadataTabularSections,
  MetadataTabularSectionsYAML,
} from "~/metadata/commonObjects/metadataTabularSection/types"
import { exportStandardAttributeDescriptionsToYAML } from "~/metadata/commonObjects/standardAttributeDescription/toYAML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { excludeNameFromI8nText } from "~/metadata/helpers/synonymHelpers"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { exportSystemEnumerationToYAMLDeprecated } from "~/metadata/systemEnumerations/toYAML"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportMetadataTabularSectionToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataTabularSection | undefined
): MetadataTabularSectionYAML | undefined => {
  if (!data) return undefined

  const filteredSynonym = excludeNameFromI8nText(context, data.synonym, data.name)
  const synonym = exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: filteredSynonym })

  const result: MetadataTabularSectionYAML = {}

  if (synonym !== undefined) result.Синоним = synonym

  if (data.lineNumberLength !== undefined) result.ДлинаНомераСтроки = data.lineNumberLength

  const use = exportSystemEnumerationToYAMLDeprecated<SE.AttributeUseYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "AttributeUse" },
    data.use
  )
  if (use !== undefined) result.Использование = use

  if (data.comment !== undefined) result.Комментарий = data.comment

  const toolTip = exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.toolTip })
  if (toolTip !== undefined) result.Подсказка = toolTip

  const objectBelonging = exportSystemEnumerationToYAMLDeprecated<SE.ObjectBelongingYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "ObjectBelonging" },
    data.objectBelonging
  )
  if (objectBelonging !== undefined) result.ПринадлежностьОбъекта = objectBelonging

  const fillChecking = exportSystemEnumerationToYAMLDeprecated<SE.FillCheckingYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "FillChecking" },
    data.fillChecking
  )
  if (fillChecking !== undefined) result.ПроверкаЗаполнения = fillChecking

  const standardAttributes = exportStandardAttributeDescriptionsToYAML(context, undefined, data.standardAttributes)
  if (standardAttributes !== undefined) result.СтандартныеРеквизиты = standardAttributes

  const attributes = exportMetadataAttributesToYAML(context, undefined, data.attributes)
  if (attributes !== undefined) result.Реквизиты = attributes

  return result
}

export const exportMetadataTabularSectionsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataTabularSections | undefined
): MetadataTabularSectionsYAML | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: MetadataTabularSection) => [
      value.name,
      exportMetadataTabularSectionToYAML(context, undefined, value)!,
    ])
  )
}

registerTypeRule("MetadataTabularSections", "exportToYAML", exportMetadataTabularSectionsToYAML)
