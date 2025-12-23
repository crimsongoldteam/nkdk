import {
  MetadataCommand,
  MetadataCommandEnterprise,
  MetadataCommandGroupEnterprise,
  MetadataCommands,
  MetadataCommandsEnterprise,
} from "~/lib/metadata/appliedObjects/metadataCommand/types"
import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { exportMetadataItemLinkToEnterprise } from "../../commonObjects/metadataItemLink/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "../../commonObjects/typeDescription/exportToEnterprise"
import { isSynonymEqualToName } from "../../helpers/isSynonymEqualToName"

export const exportMetadataCommandToEnterprise = (
  configurationSettings: ConfigurationSettings,
  data: MetadataCommand | undefined
): MetadataCommandEnterprise | undefined => {
  if (!data) return undefined

  const group = getGroup(configurationSettings, data)

  if (!group) {
    return undefined
  }

  let synonym = exportI8nTextToEnterprise(configurationSettings, data.synonym)

  const excludeSynonym = isSynonymEqualToName(synonym, data.name)

  if (canUseShortFormat(data, excludeSynonym)) {
    return group
  }

  if (excludeSynonym) {
    synonym = undefined
  }

  const result: MetadataCommandEnterprise = {
    Группа: group,
    Синоним: synonym,
    ИзменяетДанные: exportBooleanToEnterprise(configurationSettings, data.modifiesData),
    Картинка: exportPictureToEnterprise(configurationSettings, data.picture),
    Комментарий: data.comment,
    Отображение: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.representation,
      SE.ButtonRepresentationToEnterprise
    ),
    Подсказка: exportI8nTextToEnterprise(configurationSettings, data.toolTip),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise
    ),
    РежимИспользованияПараметра: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.parameterUseMode,
      SE.CommandParameterUseModeToEnterprise
    ),
    СочетаниеКлавиш: data.shortcut,
    ТипПараметраКоманды: exportTypeDescriptionToEnterprise(configurationSettings, data.commandParameterType),
    ПоведениеПриНедоступностиОсновногоСервера: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.onMainServerUnavalableBehavior,
      SE.OnMainServerUnavalableBehaviorToEnterprise
    ),
  }

  return compactObject(result) as MetadataCommandEnterprise
}

export const exportMetadataCommandsToEnterprise = (
  configurationSettings: ConfigurationSettings,
  data: MetadataCommands | undefined
): MetadataCommandsEnterprise | undefined => {
  if (!data) return undefined

  const result: MetadataCommandsEnterprise = {}
  for (const command of data) {
    const enterprise = exportMetadataCommandToEnterprise(configurationSettings, command)
    if (enterprise) {
      result[command.name] = enterprise
    }
  }

  if (Object.keys(result).length === 0) return undefined

  return result
}

const canUseShortFormat = (data: MetadataCommand, isSynonymEqualToName: boolean): boolean => {
  for (const key in data) {
    const value = data[key as keyof MetadataCommand]
    if (value === undefined) continue

    if (["name"].includes(key)) continue

    if (key == "synonym" && isSynonymEqualToName) continue

    return false
  }

  return true
}

const getGroup = (
  configurationSettings: ConfigurationSettings,
  data: MetadataCommand
): MetadataCommandGroupEnterprise | undefined => {
  if (!data.group) return undefined
  if (typeof data.group === "string" && data.group in SE.StandardCommandsGroupToEnterprise) {
    return exportSystemEnumerationToEnterprise(configurationSettings, data.group, SE.StandardCommandsGroupToEnterprise)!
  }
  return exportMetadataItemLinkToEnterprise(configurationSettings, data.group)!
}
