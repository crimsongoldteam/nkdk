import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportBaseElementToEnterprise } from "~/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportCommandBarToEnterprise } from "~/metadata/forms/elements/commandBar/exportToEnterprise"
import { FormDecoration, FormDecorationEnterprise } from "~/metadata/forms/elements/formDecoration/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportFormDecorationToEnterprise = (
  context: ConfigurationContext,
  data: FormDecoration | undefined
): FormDecorationEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(context, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(context, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
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
    Вид: exportSystemEnumerationToEnterprise(context, data.type, SE.FormDecorationTypeToEnterprise),
    Видимость: exportBooleanToEnterprise(context, data.visible),
    Высота: data.height,
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      context,
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise
    ),
    Доступность: exportBooleanToEnterprise(context, data.enabled),
    Заголовок: exportI8nTextToEnterprise(context, data.title),
    КонтекстноеМеню: exportCommandBarToEnterprise(context, data.contextMenu),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      context,
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    Подсказка: exportI8nTextToEnterprise(context, data.toolTip),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    ПропускатьПриВводе: exportBooleanToEnterprise(context, data.skipOnInput),
    РастягиватьПоВертикали: exportBooleanToEnterprise(context, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(context, data.extendedTooltip),
    СочетаниеКлавиш: data.shortcut,
    ЦветТекста: exportColorToEnterprise(context, data.textColor),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(context, data.font),
  })
}

registerMetadata("ExportToEnterprise", "FormDecoration", exportFormDecorationToEnterprise)
