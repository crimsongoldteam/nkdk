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
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataCommandToEnterprise = (
  data: MetadataCommand | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCommandEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    Группа: exportMetadataCommandGroupToEnterprise(data.group, configurationSettings),
    ИзменяетДанные: exportBooleanToEnterprise(data.modifiesData, configurationSettings),
    Имя: data.name,
    Картинка: exportPictureToEnterprise(data.picture, configurationSettings),
    Комментарий: data.comment,
    Отображение: exportSystemEnumerationToEnterprise(
      data.representation,
      SE.ButtonRepresentationToEnterprise,
      configurationSettings
    ),
    Подсказка: exportI8nTextToEnterprise(data.tooltip, configurationSettings),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise,
      configurationSettings
    ),
    РежимИспользованияПараметра: exportSystemEnumerationToEnterprise(
      data.parameterUsageMode,
      SE.CommandParameterUseModeToEnterprise,
      configurationSettings
    ),
    Синоним: exportI8nTextToEnterprise(data.synonym, configurationSettings),
    СочетаниеКлавиш: data.shortcut,
    ТипПараметраКоманды: exportTypeDescriptionToEnterprise(data.commandParameterType, configurationSettings),
  })
}

export const exportMetadataCommandsToEnterprise = (
  data: MetadataCommands | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCommandsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataCommand) => exportMetadataCommandToEnterprise(value, configurationSettings)!)
}
