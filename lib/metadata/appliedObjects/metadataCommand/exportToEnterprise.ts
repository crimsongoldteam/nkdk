import {
  MetadataCommand,
  MetadataCommandEnterprise,
  MetadataCommands,
  MetadataCommandsEnterprise,
} from "~/lib/metadata/appliedObjects/metadataCommand/types"
import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportMetadataCommandGroupToEnterprise } from "~/lib/metadata/commonObjects/metadataCommandGroup/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/lib/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataCommandToEnterprise = (
  data: MetadataCommand | undefined
): MetadataCommandEnterprise | undefined => {
  if (!data) return undefined

  return {
    ТипПараметраКоманды: exportTypeDescriptionToEnterprise(data.commandParameterType),
    Комментарий: data.comment,
    Группа: exportMetadataCommandGroupToEnterprise(data.group),
    ИзменяетДанные: exportBooleanToEnterprise(data.modifiesData),
    Имя: data.name,
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(data.objectBelonging, SE.ObjectBelongingToEnterprise),
    РежимИспользованияПараметра: exportSystemEnumerationToEnterprise(
      data.parameterUsageMode,
      SE.CommandParameterUseModeToEnterprise
    ),
    Картинка: exportPictureToEnterprise(data.picture),
    Отображение: exportSystemEnumerationToEnterprise(data.representation, SE.ButtonRepresentationToEnterprise),
    СочетаниеКлавиш: data.shortcut,
    Синоним: exportI8nTextToEnterprise(data.synonym),
    Подсказка: exportI8nTextToEnterprise(data.tooltip),
  }
}

export const exportMetadataCommandsToEnterprise = (
  data: MetadataCommands | undefined
): MetadataCommandsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataCommand) => exportMetadataCommandToEnterprise(value)!)
}
