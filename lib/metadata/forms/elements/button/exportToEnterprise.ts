import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportBaseElementToEnterprise } from "~/lib/metadata/forms/elements/baseElement/exportToEnterprise"
import { Button, ButtonEnterprise } from "~/lib/metadata/forms/elements/button/types"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportButtonToEnterprise = (
  data: Button | undefined,
  configurationSettings: ConfigurationSettings
): ButtonEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(data, configurationSettings)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight, configurationSettings),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    ИмяКоманды: data.commandName,
    УникальностьКоманды: exportBooleanToEnterprise(data.commandUniqueness, configurationSettings),
    ПутьКДанным: data.dataPath,
    КнопкаПоУмолчанию: exportBooleanToEnterprise(data.defaultButton, configurationSettings),
    АктивизироватьПоУмолчанию: exportBooleanToEnterprise(data.defaultItem, configurationSettings),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise,
      configurationSettings
    ),
    Доступность: exportBooleanToEnterprise(data.enabled, configurationSettings),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(data.extendedTooltip, configurationSettings),
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
    Высота: data.height,
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    ПоложениеВКоманднойПанели: exportSystemEnumerationToEnterprise(
      data.locationInCommandBar,
      SE.ButtonLocationInCommandBarToEnterprise,
      configurationSettings
    ),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ТолькоВоВсехДействиях: exportBooleanToEnterprise(data.onlyInAllActions, configurationSettings),
    Картинка: exportPictureToEnterprise(data.picture, configurationSettings),
    ПоложениеКартинки: exportSystemEnumerationToEnterprise(
      data.pictureLocation,
      SE.FormButtonPictureLocationToEnterprise,
      configurationSettings
    ),
    Отображение: exportSystemEnumerationToEnterprise(
      data.representation,
      SE.ButtonRepresentationToEnterprise,
      configurationSettings
    ),
    Фигура: exportSystemEnumerationToEnterprise(data.shape, SE.ButtonShapeToEnterprise, configurationSettings),
    ОтображениеФигуры: exportSystemEnumerationToEnterprise(
      data.shapeRepresentation,
      SE.ButtonShapeRepresentationToEnterprise,
      configurationSettings
    ),
    СочетаниеКлавиш: data.shortcut,
    ПропускатьПриВводе: exportBooleanToEnterprise(data.skipOnInput, configurationSettings),
    ЦветТекста: exportColorToEnterprise(data.textColor, configurationSettings),
    Заголовок: exportI8nTextToEnterprise(data.title, configurationSettings),
    ВысотаЗаголовка: data.titleHeight,
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise,
      configurationSettings
    ),
    Вид: exportSystemEnumerationToEnterprise(data.type, SE.FormButtonTypeToEnterprise, configurationSettings),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    Видимость: exportBooleanToEnterprise(data.visible, configurationSettings),
    Ширина: data.width,
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "Button", exportButtonToEnterprise)
