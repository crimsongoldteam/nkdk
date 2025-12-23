import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportBaseElementToEnterprise } from "~/lib/metadata/forms/elements/baseElement/exportToEnterprise"
import { Button, ButtonEnterprise } from "~/lib/metadata/forms/elements/button/types"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportButtonToEnterprise = (context: Context, data: Button | undefined): ButtonEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(context, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(context, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    АктивизироватьПоУмолчанию: exportBooleanToEnterprise(context, data.defaultItem),
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
    Вид: exportSystemEnumerationToEnterprise(context, data.type, SE.FormButtonTypeToEnterprise),
    Видимость: exportBooleanToEnterprise(context, data.visible),
    Высота: data.height,
    ВысотаЗаголовка: data.titleHeight,
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      context,
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise
    ),
    Доступность: exportBooleanToEnterprise(context, data.enabled),
    Заголовок: exportI8nTextToEnterprise(context, data.title),
    ИмяКоманды: data.commandName,
    Картинка: exportPictureToEnterprise(context, data.picture),
    КнопкаПоУмолчанию: exportBooleanToEnterprise(context, data.defaultButton),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    Отображение: exportSystemEnumerationToEnterprise(context, data.representation, SE.ButtonRepresentationToEnterprise),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      context,
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    ОтображениеФигуры: exportSystemEnumerationToEnterprise(
      context,
      data.shapeRepresentation,
      SE.ButtonShapeRepresentationToEnterprise
    ),
    ПоложениеВКоманднойПанели: exportSystemEnumerationToEnterprise(
      context,
      data.locationInCommandBar,
      SE.ButtonLocationInCommandBarToEnterprise
    ),
    ПоложениеКартинки: exportSystemEnumerationToEnterprise(
      context,
      data.pictureLocation,
      SE.FormButtonPictureLocationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    ПропускатьПриВводе: exportBooleanToEnterprise(context, data.skipOnInput),
    ПутьКДанным: data.dataPath,
    РастягиватьПоВертикали: exportBooleanToEnterprise(context, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(context, data.extendedTooltip),
    СочетаниеКлавиш: data.shortcut,
    ТолькоВоВсехДействиях: exportBooleanToEnterprise(context, data.onlyInAllActions),
    УникальностьКоманды: exportBooleanToEnterprise(context, data.commandUniqueness),
    Фигура: exportSystemEnumerationToEnterprise(context, data.shape, SE.ButtonShapeToEnterprise),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    ЦветТекста: exportColorToEnterprise(context, data.textColor),
    ЦветФона: exportColorToEnterprise(context, data.backColor),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(context, data.font),
  })
}

registerMetadata("ExportToEnterprise", "Button", exportButtonToEnterprise)
