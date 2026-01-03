import {
  MetadataCommand,
  MetadataCommandEnterprise,
  MetadataCommandGroupEnterprise,
  MetadataCommands,
  MetadataCommandsEnterprise,
} from "~/metadata/appliedObjects/metadataCommand/types"
import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/pictures/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { extractDifferentSynonymPart } from "~/metadata/helpers/synonymHelpers"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportMetadataItemLinkToEnterprise } from "../../commonObjects/metadataRef/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "../../commonObjects/typeDescription/exportToEnterprise"

export const exportMetadataCommandToEnterprise = (
  context: Context,
  data: MetadataCommand | undefined
): MetadataCommandEnterprise | undefined => {
  if (!data) return undefined

  const group = getGroup(context, data)

  const filteredSynonym = extractDifferentSynonymPart(context, data.synonym, data.name)
  const synonym = exportI8nTextToEnterprise(context, filteredSynonym)

  if (canUseShortFormat(data, synonym)) {
    return group
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

const canUseShortFormat = (data: MetadataCommand, synonym: I8nTextEnterprise | undefined): boolean => {
  if (synonym !== undefined) return false
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key, value]) => value !== undefined && !["name", "synonym"].includes(key))
  )
  return Object.keys(filteredData).length === 0
}

const getGroup = (context: Context, data: MetadataCommand): MetadataCommandGroupEnterprise | undefined => {
  if (!data.group) return undefined
  if (typeof data.group === "string" && data.group in SE.StandardCommandsGroupToEnterprise) {
    return exportSystemEnumerationToEnterprise(context, data.group, SE.StandardCommandsGroupToEnterprise)!
  }
  return exportMetadataItemLinkToEnterprise(context, data.group)!
}
