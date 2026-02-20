import {
  MetadataCommand,
  MetadataCommandYAML,
  MetadataCommands,
  MetadataCommandsYAML,
} from "~/metadata/appliedObjects/metadataCommand/types"
import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { exportPictureToYAML } from "~/metadata/commonObjects/picture/toYAML"
import { ConfigurationContext } from "~/metadata/context/types"
import { excludeNameFromI8nText } from "~/metadata/helpers/synonymHelpers"
import { PropertyRule, registerTypeRule } from "~/metadata/metadataFactory"
import { exportSystemEnumerationToYAMLDeprecated } from "~/metadata/systemEnumerations/toYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportMetadataItemLinkToYAML } from "../../commonObjects/metadataRef/toYAML"
import { exportTypeDescriptionToYAML } from "../../commonObjects/typeDescription/toYAML"

export const exportMetadataCommandsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: MetadataCommands | undefined
): MetadataCommandsYAML | undefined => {
  if (!data) return undefined

  return Object.fromEntries(data.map((command) => [command.name, exportMetadataCommandToYAML(context, command)!]))
}

export const exportMetadataCommandToYAML = (
  context: ConfigurationContext,
  data: MetadataCommand | undefined
): MetadataCommandYAML | undefined => {
  if (!data) return undefined

  let group: SE.StandardCommandsGroupYAML | string | undefined
  if (typeof data.group === "string" && data.group in SE.StandardCommandsGroupToYAML) {
    group = exportSystemEnumerationToYAMLDeprecated<SE.StandardCommandsGroupYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "StandardCommandsGroup" },
      data.group
    )!
  } else {
    group = exportMetadataItemLinkToYAML(context, undefined, data.group)
  }

  const filteredSynonym = excludeNameFromI8nText(context, data.synonym, data.name)
  const synonym = exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: filteredSynonym })

  if (canUseShortFormat(data, synonym)) {
    return group
  }

  const result: MetadataCommandYAML = {}

  if (group !== undefined) result.Группа = group

  if (synonym !== undefined) result.Синоним = synonym

  const modifiesData = exportBooleanToYAML(context, undefined, data.modifiesData)
  if (modifiesData !== undefined) result.ИзменяетДанные = modifiesData

  const picture = exportPictureToYAML(context, undefined, data.picture)
  if (picture !== undefined) result.Картинка = picture

  if (data.comment !== undefined) result.Комментарий = data.comment

  const representation = exportSystemEnumerationToYAMLDeprecated<SE.ButtonRepresentationYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "ButtonRepresentation" },
    data.representation
  )
  if (representation !== undefined) result.Отображение = representation

  const toolTip = exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.toolTip })
  if (toolTip !== undefined) result.Подсказка = toolTip

  const objectBelonging = exportSystemEnumerationToYAMLDeprecated<SE.ObjectBelongingYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "ObjectBelonging" },
    data.objectBelonging
  )
  if (objectBelonging !== undefined) result.ПринадлежностьОбъекта = objectBelonging

  const parameterUseMode = exportSystemEnumerationToYAMLDeprecated<SE.CommandParameterUseModeYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "CommandParameterUseMode" },
    data.parameterUseMode
  )
  if (parameterUseMode !== undefined) result.РежимИспользованияПараметра = parameterUseMode

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const commandParameterType = exportTypeDescriptionToYAML(context, undefined, data.commandParameterType)
  if (commandParameterType !== undefined) result.ТипПараметраКоманды = commandParameterType

  const onMainServerUnavalableBehavior = exportSystemEnumerationToYAMLDeprecated<SE.OnMainServerUnavalableBehaviorYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "OnMainServerUnavalableBehavior" },
    data.onMainServerUnavalableBehavior
  )
  if (onMainServerUnavalableBehavior !== undefined)
    result.ПоведениеПриНедоступностиОсновногоСервера = onMainServerUnavalableBehavior

  return result
}

const canUseShortFormat = (data: MetadataCommand, synonym: I8nTextYAML | undefined): boolean => {
  if (synonym !== undefined) return false
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key, value]) => value !== undefined && !["name", "synonym"].includes(key))
  )
  return Object.keys(filteredData).length === 0
}

registerTypeRule("MetadataCommands", "exportToYAML", exportMetadataCommandsToYAML)
