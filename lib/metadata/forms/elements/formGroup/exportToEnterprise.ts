import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportBaseElementToEnterprise } from "~/lib/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportChildItemsToEnterprise } from "~/lib/metadata/forms/elements/childItems/exportToEnterprise"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { FormGroup, FormGroupEnterprise } from "~/lib/metadata/forms/elements/formGroup/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportFormGroupToEnterprise = (data: FormGroup | undefined): FormGroupEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportBaseElementToEnterprise(data)!,

    РазрешитьИзменениеСостава: exportBooleanToEnterprise(data.enableContentChange),
    Доступность: exportBooleanToEnterprise(data.enabled),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(data.extendedTooltip),
    Высота: data.height,
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise
    ),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    ТолькоПросмотр: exportBooleanToEnterprise(data.readOnly),
    СочетаниеКлавиш: data.shortcut,
    Заголовок: exportI8nTextToEnterprise(data.title),
    ШрифтЗаголовка: exportFontToEnterprise(data.titleFont),
    ЦветТекстаЗаголовка: exportColorToEnterprise(data.titleTextColor),
    Подсказка: exportI8nTextToEnterprise(data.toolTip),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    Вид: exportSystemEnumerationToEnterprise(data.type, SE.FormGroupTypeToEnterprise),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise
    ),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch),
    Видимость: exportBooleanToEnterprise(data.visible),
    Ширина: data.width,
    ПодчиненныеЭлементы: exportChildItemsToEnterprise(data.childItems),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
  }
}

registerEnterpriseExport(FormElementType.FormGroup, exportFormGroupToEnterprise)
