import {
  MetadataCommand,
  MetadataCommandEnterprise,
  MetadataCommands,
  MetadataCommandsEnterprise,
} from "~/lib/metadata/appliedObjects/metadataCommand/types"
import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/lib/metadata/commonObjects/typeDescription/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { exportMetadataItemLinkToEnterprise } from "../../commonObjects/metadataItemLink/exportToEnterprise"
import { MetadataItemLinkEnterprise } from "../../commonObjects/metadataItemLink/types"
import { isSynonymEqualToName } from "../../helpers/isSynonymEqualToName"

export const exportMetadataCommandToEnterprise = (
  data: MetadataCommand | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCommandEnterprise | undefined => {
  if (!data) return undefined

  let synonym = exportI8nTextToEnterprise(data.synonym, configurationSettings)

  const excludeSynonym = isSynonymEqualToName(synonym, data.name)

  if (excludeSynonym) {
    synonym = undefined
  }

  let group: SE.StandardCommandsGroupEnterprise | MetadataItemLinkEnterprise | undefined
  if (data.group in SE.StandardCommandsGroupToEnterprise) {
    group = exportSystemEnumerationToEnterprise(data.group, SE.StandardCommandsGroupToEnterprise, configurationSettings)
  } else {
    group = exportMetadataItemLinkToEnterprise(data.group, configurationSettings)
  }

  return compactObject({
    Группа: group,
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
    Синоним: synonym,
    СочетаниеКлавиш: data.shortcut,
    ТипПараметраКоманды: exportTypeDescriptionToEnterprise(data.commandParameterType, configurationSettings),
    ПоведениеПриНедоступностиОсновногоСервера: exportSystemEnumerationToEnterprise(
      data.onMainServerUnavalableBehavior,
      SE.OnMainServerUnavalableBehaviorToEnterprise,
      configurationSettings
    ),
  })
}

export const exportMetadataCommandsToEnterprise = (
  data: MetadataCommands | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCommandsEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: MetadataCommand) => [value.name, exportMetadataCommandToEnterprise(value, configurationSettings)!])
  )
}
