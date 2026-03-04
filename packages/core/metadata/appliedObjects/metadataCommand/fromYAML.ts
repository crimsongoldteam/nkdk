import {
  MetadataCommand,
  MetadataCommandFullYAML,
  MetadataCommands,
  MetadataCommandsYAML,
  MetadataCommandYAML,
} from "~/metadata/appliedObjects/metadataCommand/types"
import { importBooleanFromYAML } from "~/metadata/commonObjects/boolean/fromYAML"
import { importI8nTextFromYAML } from "~/metadata/commonObjects/i8nText/fromYAML"
import { importPictureFromYAML } from "~/metadata/commonObjects/picture/fromYAML"
import { importTypeDescriptionFromYAML } from "~/metadata/commonObjects/typeDescription/fromYAML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { importSystemEnumerationFromYAMLDeprecated } from "~/metadata/systemEnumerations/fromYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { importMetadataItemLinkFromYAML } from "../../commonObjects/metadataRef/fromYAML"
import { getDefaults } from "./defaults"

export const importMetadataCommandFromYAML = (
  context: ConfigurationContext,
  data: MetadataCommandYAML | undefined,
  name: string
): MetadataCommand | undefined => {
  if (!data) return undefined

  if (typeof data === "string") {
    let group: SE.StandardCommandsGroup | string
    if (data in SE.StandardCommandsGroupFromYAML) {
      group = importSystemEnumerationFromYAMLDeprecated<SE.StandardCommandsGroup>(
        context,
        { type: "SystemEnumeration", typeSE: "StandardCommandsGroup" },
        data
      )!
    } else {
      group = importMetadataItemLinkFromYAML(context, undefined, data)!
    }

    return {
      name,
      group: group as SE.StandardCommandsGroup | string,
      synonym: addDefaultLanguageNameToSynonym(context, undefined, name),
    }
  }

  const fullData = data as MetadataCommandFullYAML

  let group: SE.StandardCommandsGroup | string
  if (typeof fullData.Группа === "string" && fullData.Группа in SE.StandardCommandsGroupFromYAML) {
    group = importSystemEnumerationFromYAMLDeprecated<SE.StandardCommandsGroup>(
      context,
      { type: "SystemEnumeration", typeSE: "StandardCommandsGroup" },
      fullData.Группа
    )!
  } else {
    group = importMetadataItemLinkFromYAML(context, undefined, fullData.Группа)!
  }

  const synonym = addDefaultLanguageNameToSynonym(
    context,
    importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: fullData.Синоним }),
    name
  )

  const result: MetadataCommand = {
    name,
    group: group as SE.StandardCommandsGroup | string,
    synonym,
  }

  const commandParameterType = importTypeDescriptionFromYAML(context, undefined, fullData.ТипПараметраКоманды)
  if (commandParameterType !== undefined) result.commandParameterType = commandParameterType

  if (fullData.Комментарий !== undefined) result.comment = fullData.Комментарий

  const modifiesData = importBooleanFromYAML(context, undefined, fullData.ИзменяетДанные)
  if (modifiesData !== undefined) result.modifiesData = modifiesData

  const objectBelonging = importSystemEnumerationFromYAMLDeprecated<SE.ObjectBelonging>(
    context,
    { type: "SystemEnumeration", typeSE: "ObjectBelonging" },
    fullData.ПринадлежностьОбъекта
  )
  if (objectBelonging !== undefined) result.objectBelonging = objectBelonging

  const parameterUseMode = importSystemEnumerationFromYAMLDeprecated<SE.CommandParameterUseMode>(
    context,
    { type: "SystemEnumeration", typeSE: "CommandParameterUseMode" },
    fullData.РежимИспользованияПараметра
  )
  if (parameterUseMode !== undefined) result.parameterUseMode = parameterUseMode

  const picture = importPictureFromYAML(context, undefined, fullData.Картинка)
  if (picture !== undefined) result.picture = picture

  const representation = importSystemEnumerationFromYAMLDeprecated<SE.ButtonRepresentation>(
    context,
    { type: "SystemEnumeration", typeSE: "ButtonRepresentation" },
    fullData.Отображение
  )
  if (representation !== undefined) result.representation = representation

  if (fullData.СочетаниеКлавиш !== undefined) result.shortcut = fullData.СочетаниеКлавиш

  const toolTip = importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: fullData.Подсказка })
  if (toolTip !== undefined) result.toolTip = toolTip

  const onMainServerUnavalableBehavior = importSystemEnumerationFromYAMLDeprecated<SE.OnMainServerUnavalableBehavior>(
    context,
    { type: "SystemEnumeration", typeSE: "OnMainServerUnavalableBehavior" },
    fullData.ПоведениеПриНедоступностиОсновногоСервера
  )
  if (onMainServerUnavalableBehavior !== undefined)
    result.onMainServerUnavalableBehavior = onMainServerUnavalableBehavior

  const defaults = getDefaults(result, context)
  return removeDefaults(result, defaults)
}

export const importMetadataCommandsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: MetadataCommandsYAML | undefined
): MetadataCommands | undefined => {
  if (!data) return undefined

  return Object.entries(data).map(([name, value]) => importMetadataCommandFromYAML(context, value, name)!)
}

registerTypeRule("MetadataCommands", "importFromYAML", importMetadataCommandsFromYAML)
