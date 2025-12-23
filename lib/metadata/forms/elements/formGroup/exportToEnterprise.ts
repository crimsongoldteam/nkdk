import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportBaseElementToEnterprise } from "~/lib/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportChildItemsToEnterprise } from "~/lib/metadata/forms/elements/childItems/exportToEnterprise"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { FormGroup, FormGroupEnterprise } from "~/lib/metadata/forms/elements/formGroup/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
