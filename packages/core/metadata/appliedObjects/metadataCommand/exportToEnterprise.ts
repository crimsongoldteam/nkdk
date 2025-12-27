import {
  MetadataCommand,
  MetadataCommandEnterprise,
  MetadataCommandGroupEnterprise,
  MetadataCommands,
  MetadataCommandsEnterprise,
} from "~/metadata/appliedObjects/metadataCommand/types"
import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/pictures/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportMetadataItemLinkToEnterprise } from "../../commonObjects/metadataRef/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "../../commonObjects/typeDescription/exportToEnterprise"
import { isSynonymEqualToName } from "../../helpers/isSynonymEqualToName"

export const exportMetadataCommandToEnterprise = (
  context: Context,
  data: MetadataCommand | undefined
): MetadataCommandEnterprise | undefined => {
  if (!data) return undefined

  const group = getGroup(context, data)

  if (!group) {
    return undefined
  }

  let synonym = exportI8nTextToEnterprise(context, data.synonym)

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
    ИзменяетДанные: exportBooleanToEnterprise(context, data.modifiesData),
    Картинка: exportPictureToEnterprise(context, data.picture),
    Комментарий: data.comment,
    Отображение: exportSystemEnumerationToEnterprise(context, data.representation, SE.ButtonRepresentationToEnterprise),
    Подсказка: exportI8nTextToEnterprise(context, data.toolTip),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      context,
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise
    ),
    РежимИспользованияПараметра: exportSystemEnumerationToEnterprise(
      context,
      data.parameterUseMode,
      SE.CommandParameterUseModeToEnterprise
    ),
    СочетаниеКлавиш: data.shortcut,
    ТипПараметраКоманды: exportTypeDescriptionToEnterprise(context, data.commandParameterType),
    ПоведениеПриНедоступностиОсновногоСервера: exportSystemEnumerationToEnterprise(
      context,
      data.onMainServerUnavalableBehavior,
      SE.OnMainServerUnavalableBehaviorToEnterprise
    ),
  }

  return compactObject(result) as MetadataCommandEnterprise
}

export const exportMetadataCommandsToEnterprise = (
  context: Context,
  data: MetadataCommands | undefined
): MetadataCommandsEnterprise | undefined => {
  if (!data) return undefined

  const result: MetadataCommandsEnterprise = {}
  for (const command of data) {
    const enterprise = exportMetadataCommandToEnterprise(context, command)
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

const getGroup = (context: Context, data: MetadataCommand): MetadataCommandGroupEnterprise | undefined => {
  if (!data.group) return undefined
  if (typeof data.group === "string" && data.group in SE.StandardCommandsGroupToEnterprise) {
    return exportSystemEnumerationToEnterprise(context, data.group, SE.StandardCommandsGroupToEnterprise)!
  }
  return exportMetadataItemLinkToEnterprise(context, data.group)!
}
