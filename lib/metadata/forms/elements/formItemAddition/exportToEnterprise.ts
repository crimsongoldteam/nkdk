import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportBaseElementToEnterprise } from "~/lib/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportChildItemsToEnterprise } from "~/lib/metadata/forms/elements/childItems/exportToEnterprise"
import { exportCommandBarToEnterprise } from "~/lib/metadata/forms/elements/commandBar/exportToEnterprise"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { FormItemAddition, FormItemAdditionEnterprise } from "~/lib/metadata/forms/elements/formItemAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportFormItemAdditionToEnterprise = (
  configurationSettings: Context,
  data: FormItemAddition | undefined
): FormItemAdditionEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(configurationSettings, data)!,

    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise
    ),
    Вид: exportSystemEnumerationToEnterprise(configurationSettings, data.type, SE.FormItemAdditionTypeToEnterprise),
    Видимость: exportBooleanToEnterprise(configurationSettings, data.visible),
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise
    ),
    Доступность: exportBooleanToEnterprise(configurationSettings, data.enabled),
    Заголовок: exportI8nTextToEnterprise(configurationSettings, data.title),
    КонтекстноеМеню: exportCommandBarToEnterprise(configurationSettings, data.contextMenu),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    Подсказка: exportI8nTextToEnterprise(configurationSettings, data.toolTip),
    ПодчиненныеЭлементы: exportChildItemsToEnterprise(configurationSettings, data.childItems),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(configurationSettings, data.extendedToolTip),
  })
}

registerMetadata("ExportToEnterprise", "FormItemAddition", exportFormItemAdditionToEnterprise)
