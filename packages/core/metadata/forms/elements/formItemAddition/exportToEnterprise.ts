import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { exportBaseElementToEnterprise } from "~/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportChildItemsToEnterprise } from "~/metadata/forms/elements/childItems/exportToEnterprise"
import { exportCommandBarToEnterprise } from "~/metadata/forms/elements/commandBar/exportToEnterprise"
import { exportFormDecorationToEnterprise } from "~/metadata/forms/elements/formDecoration/exportToEnterprise"
import { FormItemAddition, FormItemAdditionEnterprise } from "~/metadata/forms/elements/formItemAddition/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportFormItemAdditionToEnterprise = (
  context: Context,
  data: FormItemAddition | undefined
): FormItemAdditionEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(context, data)!,

    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      context,
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      context,
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise
    ),
    Вид: exportSystemEnumerationToEnterprise(context, data.type, SE.FormItemAdditionTypeToEnterprise),
    Видимость: exportBooleanToEnterprise(context, data.visible),
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      context,
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise
    ),
    Доступность: exportBooleanToEnterprise(context, data.enabled),
    Заголовок: exportI8nTextToEnterprise(context, data.title),
    КонтекстноеМеню: exportCommandBarToEnterprise(context, data.contextMenu),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      context,
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    Подсказка: exportI8nTextToEnterprise(context, data.toolTip),
    ПодчиненныеЭлементы: exportChildItemsToEnterprise(context, data.childItems),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(context, data.extendedToolTip),
  })
}

registerMetadata("ExportToEnterprise", "FormItemAddition", exportFormItemAdditionToEnterprise)
