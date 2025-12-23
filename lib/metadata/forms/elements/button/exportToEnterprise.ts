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

export const exportButtonToEnterprise = (
  configurationSettings: Context,
  data: Button | undefined
): ButtonEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(configurationSettings, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(configurationSettings, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(configurationSettings, data.autoMaxWidth),
    АктивизироватьПоУмолчанию: exportBooleanToEnterprise(configurationSettings, data.defaultItem),
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
    Вид: exportSystemEnumerationToEnterprise(configurationSettings, data.type, SE.FormButtonTypeToEnterprise),
    Видимость: exportBooleanToEnterprise(configurationSettings, data.visible),
    Высота: data.height,
    ВысотаЗаголовка: data.titleHeight,
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise
    ),
    Доступность: exportBooleanToEnterprise(configurationSettings, data.enabled),
    Заголовок: exportI8nTextToEnterprise(configurationSettings, data.title),
    ИмяКоманды: data.commandName,
    Картинка: exportPictureToEnterprise(configurationSettings, data.picture),
    КнопкаПоУмолчанию: exportBooleanToEnterprise(configurationSettings, data.defaultButton),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    Отображение: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.representation,
      SE.ButtonRepresentationToEnterprise
    ),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    ОтображениеФигуры: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.shapeRepresentation,
      SE.ButtonShapeRepresentationToEnterprise
    ),
    ПоложениеВКоманднойПанели: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.locationInCommandBar,
      SE.ButtonLocationInCommandBarToEnterprise
    ),
    ПоложениеКартинки: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.pictureLocation,
      SE.FormButtonPictureLocationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    ПропускатьПриВводе: exportBooleanToEnterprise(configurationSettings, data.skipOnInput),
    ПутьКДанным: data.dataPath,
    РастягиватьПоВертикали: exportBooleanToEnterprise(configurationSettings, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(configurationSettings, data.horizontalStretch),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(configurationSettings, data.extendedTooltip),
    СочетаниеКлавиш: data.shortcut,
    ТолькоВоВсехДействиях: exportBooleanToEnterprise(configurationSettings, data.onlyInAllActions),
    УникальностьКоманды: exportBooleanToEnterprise(configurationSettings, data.commandUniqueness),
    Фигура: exportSystemEnumerationToEnterprise(configurationSettings, data.shape, SE.ButtonShapeToEnterprise),
    ЦветРамки: exportColorToEnterprise(configurationSettings, data.borderColor),
    ЦветТекста: exportColorToEnterprise(configurationSettings, data.textColor),
    ЦветФона: exportColorToEnterprise(configurationSettings, data.backColor),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(configurationSettings, data.font),
  })
}

registerMetadata("ExportToEnterprise", "Button", exportButtonToEnterprise)
