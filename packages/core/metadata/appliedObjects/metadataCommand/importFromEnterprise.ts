import {
  MetadataCommand,
  MetadataCommandEnterprise,
  MetadataCommandFullEnterprise,
  MetadataCommands,
  MetadataCommandsEnterprise,
} from "~/metadata/appliedObjects/metadataCommand/types"
import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importPictureFromEnterprise } from "~/metadata/commonObjects/picture/importFromEnterprise"
import { importTypeDescriptionFromEnterprise } from "~/metadata/commonObjects/typeDescription/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importMetadataItemLinkFromEnterprise } from "../../commonObjects/metadataRef/importFromEnterprise"
import { getDefaults } from "./defaults"

export const importMetadataCommandFromEnterprise = (
  context: ConfigurationContext,
  data: MetadataCommandEnterprise | undefined,
  name: string
): MetadataCommand | undefined => {
  if (!data) return undefined

  if (typeof data === "string") {
    let group: SE.StandardCommandsGroup | string
    if (data in SE.StandardCommandsGroupFromEnterprise) {
      group = importSystemEnumerationFromYAML<SE.StandardCommandsGroup>(
        context,
        { type: "SystemEnumeration", typeSE: "StandardCommandsGroup" },
        data
      )!
    } else {
      group = importMetadataItemLinkFromEnterprise(context, undefined, data)!
    }

    return {
      name,
      group: group as SE.StandardCommandsGroup | string,
      synonym: addDefaultLanguageNameToSynonym(context, undefined, name),
    }
  }

  const fullData = data as MetadataCommandFullEnterprise

  let group: SE.StandardCommandsGroup | string
  if (typeof fullData.Группа === "string" && fullData.Группа in SE.StandardCommandsGroupFromEnterprise) {
    group = importSystemEnumerationFromYAML<SE.StandardCommandsGroup>(
      context,
      { type: "SystemEnumeration", typeSE: "StandardCommandsGroup" },
      fullData.Группа
    )!
  } else {
    group = importMetadataItemLinkFromEnterprise(context, undefined, fullData.Группа)!
  }

  const synonym = addDefaultLanguageNameToSynonym(
    context,
    importI8nTextFromEnterprise(context, { type: "I8nText" }, fullData.Синоним),
    name
  )

  const result: MetadataCommand = {
    name,
    group: group as SE.StandardCommandsGroup | string,
    synonym,
  }

  const commandParameterType = importTypeDescriptionFromEnterprise(context, undefined, fullData.ТипПараметраКоманды)
  if (commandParameterType !== undefined) result.commandParameterType = commandParameterType

  if (fullData.Комментарий !== undefined) result.comment = fullData.Комментарий

  const modifiesData = importBooleanFromEnterprise(context, undefined, fullData.ИзменяетДанные)
  if (modifiesData !== undefined) result.modifiesData = modifiesData

  const objectBelonging = importSystemEnumerationFromYAML<SE.ObjectBelonging>(
    context,
    { type: "SystemEnumeration", typeSE: "ObjectBelonging" },
    fullData.ПринадлежностьОбъекта
  )
  if (objectBelonging !== undefined) result.objectBelonging = objectBelonging

  const parameterUseMode = importSystemEnumerationFromYAML<SE.CommandParameterUseMode>(
    context,
    { type: "SystemEnumeration", typeSE: "CommandParameterUseMode" },
    fullData.РежимИспользованияПараметра
  )
  if (parameterUseMode !== undefined) result.parameterUseMode = parameterUseMode

  const picture = importPictureFromEnterprise(context, undefined, fullData.Картинка)
  if (picture !== undefined) result.picture = picture

  const representation = importSystemEnumerationFromYAML<SE.ButtonRepresentation>(
    context,
    { type: "SystemEnumeration", typeSE: "ButtonRepresentation" },
    fullData.Отображение
  )
  if (representation !== undefined) result.representation = representation

  if (fullData.СочетаниеКлавиш !== undefined) result.shortcut = fullData.СочетаниеКлавиш

  const toolTip = importI8nTextFromEnterprise(context, { type: "I8nText" }, fullData.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const onMainServerUnavalableBehavior = importSystemEnumerationFromYAML<SE.OnMainServerUnavalableBehavior>(
    context,
    { type: "SystemEnumeration", typeSE: "OnMainServerUnavalableBehavior" },
    fullData.ПоведениеПриНедоступностиОсновногоСервера
  )
  if (onMainServerUnavalableBehavior !== undefined)
    result.onMainServerUnavalableBehavior = onMainServerUnavalableBehavior

  const defaults = getDefaults(result, context)
  return removeDefaults(result, defaults)
}

export const importMetadataCommandsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: MetadataCommandsEnterprise | undefined
): MetadataCommands | undefined => {
  if (!data) return undefined

  return Object.entries(data).map(([name, value]) => importMetadataCommandFromEnterprise(context, value, name)!)
}
