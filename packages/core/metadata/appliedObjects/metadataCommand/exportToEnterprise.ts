import {
  MetadataCommand,
  MetadataCommandEnterprise,
  MetadataCommands,
  MetadataCommandsEnterprise,
} from "~/metadata/appliedObjects/metadataCommand/types"
import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { excludeNameFromI8nText } from "~/metadata/helpers/synonymHelpers"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportMetadataItemLinkToEnterprise } from "../../commonObjects/metadataRef/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "../../commonObjects/typeDescription/exportToEnterprise"

export const exportMetadataCommandsToEnterprise = (
  context: ConfigurationContext,
  data: MetadataCommands | undefined
): MetadataCommandsEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(data.map((command) => [command.name, exportMetadataCommandToEnterprise(context, command)!]))
}

export const exportMetadataCommandToEnterprise = (
  context: ConfigurationContext,
  data: MetadataCommand | undefined
): MetadataCommandEnterprise | undefined => {
  if (!data) return undefined

  let group: SE.StandardCommandsGroupEnterprise | string | undefined
  if (typeof data.group === "string" && data.group in SE.StandardCommandsGroupToEnterprise) {
    group = exportSystemEnumerationToYAML<SE.StandardCommandsGroupEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "StandardCommandsGroup" },
      data.group
    )!
  } else {
    group = exportMetadataItemLinkToEnterprise(context, undefined, data.group)
  }

  const filteredSynonym = excludeNameFromI8nText(context, data.synonym, data.name)
  const synonym = exportI8nTextToYAML(context, { type: "I8nText" }, filteredSynonym)

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

  const representation = exportSystemEnumerationToYAML<SE.ButtonRepresentationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ButtonRepresentation" },
    data.representation
  )
  if (representation !== undefined) result.Отображение = representation

  const toolTip = exportI8nTextToYAML(context, { type: "I8nText" }, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const objectBelonging = exportSystemEnumerationToYAML<SE.ObjectBelongingEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ObjectBelonging" },
    data.objectBelonging
  )
  if (objectBelonging !== undefined) result.ПринадлежностьОбъекта = objectBelonging

  const parameterUseMode = exportSystemEnumerationToYAML<SE.CommandParameterUseModeEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "CommandParameterUseMode" },
    data.parameterUseMode
  )
  if (parameterUseMode !== undefined) result.РежимИспользованияПараметра = parameterUseMode

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const commandParameterType = exportTypeDescriptionToEnterprise(context, undefined, data.commandParameterType)
  if (commandParameterType !== undefined) result.ТипПараметраКоманды = commandParameterType

  const onMainServerUnavalableBehavior = exportSystemEnumerationToYAML<SE.OnMainServerUnavalableBehaviorEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "OnMainServerUnavalableBehavior" },
    data.onMainServerUnavalableBehavior
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
