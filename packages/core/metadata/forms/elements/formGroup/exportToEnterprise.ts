import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { exportBaseElementToEnterprise } from "~/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportChildItemsToEnterprise } from "~/metadata/forms/elements/childItems/exportToEnterprise"
import { exportFormDecorationToEnterprise } from "~/metadata/forms/elements/formDecoration/exportToEnterprise"
import { FormGroup, FormGroupEnterprise } from "~/metadata/forms/elements/formGroup/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportFormGroupToEnterprise = (
  context: Context,
  data: FormGroup | undefined
): FormGroupEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(context, data)!,

    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      context,
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise
    ),
    Вид: exportSystemEnumerationToEnterprise(context, data.type, SE.FormGroupTypeToEnterprise),
    Видимость: exportBooleanToEnterprise(context, data.visible),
    Высота: data.height,
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      context,
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise
    ),
    Доступность: exportBooleanToEnterprise(context, data.enabled),
    Заголовок: exportI8nTextToEnterprise(context, data.title),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      context,
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    Подсказка: exportI8nTextToEnterprise(context, data.toolTip),
    ПодчиненныеЭлементы: exportChildItemsToEnterprise(context, data.childItems),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    РазрешитьИзменениеСостава: exportBooleanToEnterprise(context, data.enableContentChange),
    РастягиватьПоВертикали: exportBooleanToEnterprise(context, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(context, data.extendedTooltip),
    СочетаниеКлавиш: data.shortcut,
    ТолькоПросмотр: exportBooleanToEnterprise(context, data.readOnly),
    ЦветТекстаЗаголовка: exportColorToEnterprise(context, data.titleTextColor),
    Ширина: data.width,
    ШрифтЗаголовка: exportFontToEnterprise(context, data.titleFont),
  })
}

registerMetadata("ExportToEnterprise", "FormGroup", exportFormGroupToEnterprise)
