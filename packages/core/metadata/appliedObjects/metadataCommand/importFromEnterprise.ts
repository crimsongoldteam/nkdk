import {
  MetadataCommand,
  MetadataCommandEnterprise,
  MetadataCommandFullEnterprise,
  MetadataCommands,
  MetadataCommandsEnterprise,
} from "~/metadata/appliedObjects/metadataCommand/types"
import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importPictureFromEnterprise } from "~/metadata/commonObjects/pictures/importFromEnterprise"
import { importTypeDescriptionFromEnterprise } from "~/metadata/commonObjects/typeDescription/importFromEnterprise"
import { Context } from "~/metadata/context/types"
import { compactObject, removeDefaults } from "~/metadata/helpers/compactObject"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importMetadataItemLinkFromEnterprise } from "../../commonObjects/metadataRef/importFromEnterprise"
import { getDefaults } from "./defaults"

export const importMetadataCommandFromEnterprise = (
  context: Context,
  data: MetadataCommandEnterprise | undefined,
  name: string
): MetadataCommand | undefined => {
  if (!data) return undefined

  // Если data - строка, это короткий формат (только группа)
  if (typeof data === "string") {
    let group: SE.StandardCommandsGroup | string
    if (data in SE.StandardCommandsGroupFromEnterprise) {
      group = importSystemEnumerationFromEnterprise(context, data, SE.StandardCommandsGroupFromEnterprise)!
    } else {
      group = importMetadataItemLinkFromEnterprise(context, data)!
    }

    return {
      name,
      group: group as SE.StandardCommandsGroup | string,
    }
  }

  // Полный формат - объект
  const fullData = data as MetadataCommandFullEnterprise

  let group: SE.StandardCommandsGroup | string
  if (typeof fullData.Группа === "string" && fullData.Группа in SE.StandardCommandsGroupFromEnterprise) {
    group = importSystemEnumerationFromEnterprise(context, fullData.Группа, SE.StandardCommandsGroupFromEnterprise)!
  } else {
    group = importMetadataItemLinkFromEnterprise(context, fullData.Группа)!
  }

  const result: MetadataCommand = {
    name,
    group: group as SE.StandardCommandsGroup | string,
    commandParameterType: importTypeDescriptionFromEnterprise(context, fullData.ТипПараметраКоманды),
    comment: fullData.Комментарий,
    modifiesData: importBooleanFromEnterprise(fullData.ИзменяетДанные, context),
    objectBelonging: importSystemEnumerationFromEnterprise(
      context,
      fullData.ПринадлежностьОбъекта,
      SE.ObjectBelongingFromEnterprise
    ),
    parameterUseMode: importSystemEnumerationFromEnterprise(
      context,
      fullData.РежимИспользованияПараметра,
      SE.CommandParameterUseModeFromEnterprise
    ),
    picture: importPictureFromEnterprise(context, fullData.Картинка),
    representation: importSystemEnumerationFromEnterprise(
      context,
      fullData.Отображение,
      SE.ButtonRepresentationFromEnterprise
    ),
    shortcut: fullData.СочетаниеКлавиш,
    synonym: importI8nTextFromEnterprise(context, fullData.Синоним),
    toolTip: importI8nTextFromEnterprise(context, fullData.Подсказка),
    onMainServerUnavalableBehavior: importSystemEnumerationFromEnterprise(
      context,
      fullData.ПоведениеПриНедоступностиОсновногоСервера,
      SE.OnMainServerUnavalableBehaviorFromEnterprise
    ),
  }

  const compactedResult = compactObject(result)
  const defaults = getDefaults(compactedResult, context)
  return removeDefaults(compactedResult, defaults)
}

export const importMetadataCommandsFromEnterprise = (
  context: Context,
  data: MetadataCommandsEnterprise | undefined
): MetadataCommands | undefined => {
  if (!data) return undefined

  const result: MetadataCommands = []
  for (const [name, value] of Object.entries(data)) {
    const command = importMetadataCommandFromEnterprise(context, value, name)
    if (command) {
      result.push(command)
    }
  }

  if (result.length === 0) return undefined

  return result
}

