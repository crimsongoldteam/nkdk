import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportBaseElementToEnterprise } from "~/lib/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportCommandBarToEnterprise } from "~/lib/metadata/forms/elements/commandBar/exportToEnterprise"
import { FormDecoration, FormDecorationEnterprise } from "~/lib/metadata/forms/elements/formDecoration/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportFormDecorationToEnterprise = (
  data: FormDecoration | undefined
): FormDecorationEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportBaseElementToEnterprise(data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    КонтекстноеМеню: exportCommandBarToEnterprise(data.contextMenu),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    Доступность: exportBooleanToEnterprise(data.enabled),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(data.extendedTooltip),
    Шрифт: exportFontToEnterprise(data.font),
    Высота: data.height,
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise
    ),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    СочетаниеКлавиш: data.shortcut,
    ПропускатьПриВводе: exportBooleanToEnterprise(data.skipOnInput),
    ЦветТекста: exportColorToEnterprise(data.textColor),
    Заголовок: exportI8nTextToEnterprise(data.title),
    Подсказка: exportI8nTextToEnterprise(data.toolTip),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    Вид: exportSystemEnumerationToEnterprise(data.type, SE.FormDecorationTypeToEnterprise),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise
    ),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch),
    Видимость: exportBooleanToEnterprise(data.visible),
    Ширина: data.width,
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
  }
}

registerEnterpriseExport(FormElementType.FormDecoration, exportFormDecorationToEnterprise)
