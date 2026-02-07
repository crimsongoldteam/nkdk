import {
  MetadataCommand,
  MetadataCommandEnterprise,
  MetadataCommands,
  MetadataCommandsEnterprise,
} from "~/metadata/appliedObjects/metadataCommand/types"
import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { extractDifferentSynonymPart } from "~/metadata/helpers/synonymHelpers"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportMetadataItemLinkToEnterprise } from "../../commonObjects/metadataRef/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "../../commonObjects/typeDescription/exportToEnterprise"

export const exportMetadataCommandsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: MetadataCommands | undefined
): MetadataCommandsEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((command) => [command.name, exportMetadataCommandToEnterprise(context, undefined, command)!])
  )
}

export const exportMetadataCommandToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: MetadataCommand | undefined
): MetadataCommandEnterprise | undefined => {
  if (!data) return undefined

  let group: SE.StandardCommandsGroupEnterprise | string | undefined
  if (typeof data.group === "string" && data.group in SE.StandardCommandsGroupToEnterprise) {
    group = exportSystemEnumerationToEnterprise(context, undefined, data.group, SE.StandardCommandsGroupToEnterprise)!
  } else {
    group = exportMetadataItemLinkToEnterprise(context, undefined, data.group)
  }

  const filteredSynonym = extractDifferentSynonymPart(context, data.synonym, data.name)
  const synonym = exportI8nTextToYAML(context, undefined, filteredSynonym)

  if (canUseShortFormat(data, synonym)) {
    return group
  }

  const result: MetadataCommandEnterprise = {}

  if (group !== undefined) result.Группа = group

  if (synonym !== undefined) result.Синоним = synonym

  const modifiesData = exportBooleanToEnterprise(context, undefined, data.modifiesData)
  if (modifiesData !== undefined) result.ИзменяетДанные = modifiesData

  const picture = exportPictureToEnterprise(context, undefined, data.picture)
  if (picture !== undefined) result.Картинка = picture

  if (data.comment !== undefined) result.Комментарий = data.comment

  const representation = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.representation,
    SE.ButtonRepresentationToEnterprise
  )
  if (representation !== undefined) result.Отображение = representation

  const toolTip = exportI8nTextToYAML(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const objectBelonging = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.objectBelonging,
    SE.ObjectBelongingToEnterprise
  )
  if (objectBelonging !== undefined) result.ПринадлежностьОбъекта = objectBelonging

  const parameterUseMode = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.parameterUseMode,
    SE.CommandParameterUseModeToEnterprise
  )
  if (parameterUseMode !== undefined) result.РежимИспользованияПараметра = parameterUseMode

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const commandParameterType = exportTypeDescriptionToEnterprise(context, undefined, data.commandParameterType)
  if (commandParameterType !== undefined) result.ТипПараметраКоманды = commandParameterType

  const onMainServerUnavalableBehavior = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.onMainServerUnavalableBehavior,
    SE.OnMainServerUnavalableBehaviorToEnterprise
  )
  if (onMainServerUnavalableBehavior !== undefined)
    result.ПоведениеПриНедоступностиОсновногоСервера = onMainServerUnavalableBehavior

  return result
}

const canUseShortFormat = (data: MetadataCommand, synonym: I8nTextEnterprise | undefined): boolean => {
  if (synonym !== undefined) return false
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key, value]) => value !== undefined && !["name", "synonym"].includes(key))
  )
  return Object.keys(filteredData).length === 0
}
