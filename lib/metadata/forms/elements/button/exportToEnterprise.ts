import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportBaseElementToEnterprise } from "~/lib/metadata/forms/elements/baseElement/exportToEnterprise"
import { Button, ButtonEnterprise } from "~/lib/metadata/forms/elements/button/types"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportButtonToEnterprise = (data: Button | undefined): ButtonEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportBaseElementToEnterprise(data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    ЦветФона: exportColorToEnterprise(data.backColor),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    ИмяКоманды: data.commandName,
    УникальностьКоманды: exportBooleanToEnterprise(data.commandUniqueness),
    ПутьКДанным: data.dataPath,
    КнопкаПоУмолчанию: exportBooleanToEnterprise(data.defaultButton),
    АктивизироватьПоУмолчанию: exportBooleanToEnterprise(data.defaultItem),
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
    ПоложениеВКоманднойПанели: exportSystemEnumerationToEnterprise(
      data.locationInCommandBar,
      SE.ButtonLocationInCommandBarToEnterprise
    ),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ТолькоВоВсехДействиях: exportBooleanToEnterprise(data.onlyInAllActions),
    Картинка: exportPictureToEnterprise(data.picture),
    ПоложениеКартинки: exportSystemEnumerationToEnterprise(
      data.pictureLocation,
      SE.FormButtonPictureLocationToEnterprise
    ),
    Отображение: exportSystemEnumerationToEnterprise(data.representation, SE.ButtonRepresentationToEnterprise),
    Фигура: exportSystemEnumerationToEnterprise(data.shape, SE.ButtonShapeToEnterprise),
    ОтображениеФигуры: exportSystemEnumerationToEnterprise(
      data.shapeRepresentation,
      SE.ButtonShapeRepresentationToEnterprise
    ),
    СочетаниеКлавиш: data.shortcut,
    ПропускатьПриВводе: exportBooleanToEnterprise(data.skipOnInput),
    ЦветТекста: exportColorToEnterprise(data.textColor),
    Заголовок: exportI8nTextToEnterprise(data.title),
    ВысотаЗаголовка: data.titleHeight,
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    Вид: exportSystemEnumerationToEnterprise(data.type, SE.FormButtonTypeToEnterprise),
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

registerEnterpriseExport(FormElementType.Button, exportButtonToEnterprise)
