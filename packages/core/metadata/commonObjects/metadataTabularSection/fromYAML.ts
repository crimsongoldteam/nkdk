import { importI8nTextFromYAML } from "~/metadata/commonObjects/i8nText/fromYAML"
import { importMetadataAttributesFromYAML } from "~/metadata/commonObjects/metadataAttribute/fromYAML"
import {
  MetadataTabularSection,
  MetadataTabularSectionYAML,
  MetadataTabularSections,
  MetadataTabularSectionsYAML,
} from "~/metadata/commonObjects/metadataTabularSection/types"
import { importStandardAttributeDescriptionsFromYAML } from "~/metadata/commonObjects/standardAttributeDescription/fromYAML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { importSystemEnumerationFromYAMLDeprecated } from "~/metadata/systemEnumerations/fromYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { getDefaults } from "./defaults"

export const importMetadataTabularSectionFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataTabularSectionYAML | undefined,
  name: string
): MetadataTabularSection | undefined => {
  if (!data) return undefined

  const result: MetadataTabularSection = {
    name,
    synonym: addDefaultLanguageNameToSynonym(
      context,
      importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: data.Синоним }),
      name
    ),
  }

  if (data.Комментарий !== undefined) result.comment = data.Комментарий

  const fillChecking = importSystemEnumerationFromYAMLDeprecated<SE.FillChecking>(
    context,
    { type: "SystemEnumeration", typeSE: "FillChecking" },
    data.ПроверкаЗаполнения
  )
  if (fillChecking !== undefined) result.fillChecking = fillChecking

  if (data.ДлинаНомераСтроки !== undefined) result.lineNumberLength = data.ДлинаНомераСтроки

  const use = importSystemEnumerationFromYAMLDeprecated<SE.AttributeUse>(
    context,
    { type: "SystemEnumeration", typeSE: "AttributeUse" },
    data.Использование
  )
  if (use !== undefined) result.use = use

  // const objectBelonging = importSystemEnumerationFromYAML(
  //   context,
  //   data.ПринадлежностьОбъекта,
  //   SE.ObjectBelongingFromYAML
  // )
  // if (objectBelonging !== undefined) result.objectBelonging = objectBelonging

  const toolTip = importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: data.Подсказка })
  if (toolTip !== undefined) result.toolTip = toolTip

  const standardAttributes = importStandardAttributeDescriptionsFromYAML(context, undefined, data.СтандартныеРеквизиты)
  if (standardAttributes !== undefined) result.standardAttributes = standardAttributes

  const attributes = importMetadataAttributesFromYAML(context, undefined, data.Реквизиты)
  if (attributes !== undefined) result.attributes = attributes

  const defaults = getDefaults(context, result)
  return removeDefaults(result, defaults)
}

export const importMetadataTabularSectionsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataTabularSectionsYAML | undefined
): MetadataTabularSections | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataTabularSectionFromYAML(context, undefined, value, name))
    .filter((item): item is MetadataTabularSection => item !== undefined)
}

registerTypeRule("MetadataTabularSections", "importFromYAML", importMetadataTabularSectionsFromYAML)
