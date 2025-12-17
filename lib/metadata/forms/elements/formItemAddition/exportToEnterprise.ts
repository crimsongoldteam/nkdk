import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportBaseElementToEnterprise } from "~/lib/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportChildItemsToEnterprise } from "~/lib/metadata/forms/elements/childItems/exportToEnterprise"
import { exportCommandBarToEnterprise } from "~/lib/metadata/forms/elements/commandBar/exportToEnterprise"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { FormItemAddition, FormItemAdditionEnterprise } from "~/lib/metadata/forms/elements/formItemAddition/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportFormItemAdditionToEnterprise = (
  data: FormItemAddition | undefined
): FormItemAdditionEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportBaseElementToEnterprise(data)!,

    КонтекстноеМеню: exportCommandBarToEnterprise(data.contextMenu),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    Доступность: exportBooleanToEnterprise(data.enabled),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(data.extendedToolTip),
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise
    ),
    Заголовок: exportI8nTextToEnterprise(data.title),
    Подсказка: exportI8nTextToEnterprise(data.toolTip),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    Вид: exportSystemEnumerationToEnterprise(data.type, SE.FormItemAdditionTypeToEnterprise),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise
    ),
    Видимость: exportBooleanToEnterprise(data.visible),
    ПодчиненныеЭлементы: exportChildItemsToEnterprise(data.childItems),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
  }
}

registerEnterpriseExport(FormElementType.FormItemAddition, exportFormItemAdditionToEnterprise)
