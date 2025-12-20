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
  data: MetadataCommand | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCommandEnterprise | undefined => {
  if (!data) return undefined

  const group = getGroup(data, configurationSettings)

  if (!group) {
    return undefined
  }

  let synonym = exportI8nTextToEnterprise(data.synonym, configurationSettings)

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
    ИзменяетДанные: exportBooleanToEnterprise(data.modifiesData, configurationSettings),
    Картинка: exportPictureToEnterprise(data.picture, configurationSettings),
    Комментарий: data.comment,
    Отображение: exportSystemEnumerationToEnterprise(
      data.representation,
      SE.ButtonRepresentationToEnterprise,
      configurationSettings
    ),
    Подсказка: exportI8nTextToEnterprise(data.toolTip, configurationSettings),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise,
      configurationSettings
    ),
    РежимИспользованияПараметра: exportSystemEnumerationToEnterprise(
      data.parameterUseMode,
      SE.CommandParameterUseModeToEnterprise,
      configurationSettings
    ),
    СочетаниеКлавиш: data.shortcut,
    ТипПараметраКоманды: exportTypeDescriptionToEnterprise(data.commandParameterType, configurationSettings),
    ПоведениеПриНедоступностиОсновногоСервера: exportSystemEnumerationToEnterprise(
      data.onMainServerUnavalableBehavior,
      SE.OnMainServerUnavalableBehaviorToEnterprise,
      configurationSettings
    ),
  }

  return compactObject(result) as MetadataCommandEnterprise
}

export const exportMetadataCommandsToEnterprise = (
  data: MetadataCommands | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCommandsEnterprise | undefined => {
  if (!data) return undefined

  const result: MetadataCommandsEnterprise = {}
  for (const command of data) {
    const enterprise = exportMetadataCommandToEnterprise(command, configurationSettings)
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
  data: MetadataCommand,
  configurationSettings: ConfigurationSettings
): MetadataCommandGroupEnterprise | undefined => {
  if (!data.group) return undefined
  if (typeof data.group === "string" && data.group in SE.StandardCommandsGroupToEnterprise) {
    return exportSystemEnumerationToEnterprise(data.group, SE.StandardCommandsGroupToEnterprise, configurationSettings)!
  }
  return exportMetadataItemLinkToEnterprise(data.group, configurationSettings)!
}
