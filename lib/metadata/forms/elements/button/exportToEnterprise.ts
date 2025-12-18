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
    АктивизироватьПоУмолчанию: exportBooleanToEnterprise(data.defaultItem, configurationSettings),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise,
      configurationSettings
    ),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
    Вид: exportSystemEnumerationToEnterprise(data.type, SE.FormButtonTypeToEnterprise, configurationSettings),
    Видимость: exportBooleanToEnterprise(data.visible, configurationSettings),
    Высота: data.height,
    ВысотаЗаголовка: data.titleHeight,
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    Доступность: exportBooleanToEnterprise(data.enabled, configurationSettings),
    Заголовок: exportI8nTextToEnterprise(data.title, configurationSettings),
    ИмяКоманды: data.commandName,
    Картинка: exportPictureToEnterprise(data.picture, configurationSettings),
    КнопкаПоУмолчанию: exportBooleanToEnterprise(data.defaultButton, configurationSettings),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    Отображение: exportSystemEnumerationToEnterprise(
      data.representation,
      SE.ButtonRepresentationToEnterprise,
      configurationSettings
    ),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise,
      configurationSettings
    ),
    ОтображениеФигуры: exportSystemEnumerationToEnterprise(
      data.shapeRepresentation,
      SE.ButtonShapeRepresentationToEnterprise,
      configurationSettings
    ),
    ПоложениеВКоманднойПанели: exportSystemEnumerationToEnterprise(
      data.locationInCommandBar,
      SE.ButtonLocationInCommandBarToEnterprise,
      configurationSettings
    ),
    ПоложениеКартинки: exportSystemEnumerationToEnterprise(
      data.pictureLocation,
      SE.FormButtonPictureLocationToEnterprise,
      configurationSettings
    ),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    ПропускатьПриВводе: exportBooleanToEnterprise(data.skipOnInput, configurationSettings),
    ПутьКДанным: data.dataPath,
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(data.extendedTooltip, configurationSettings),
    СочетаниеКлавиш: data.shortcut,
    ТолькоВоВсехДействиях: exportBooleanToEnterprise(data.onlyInAllActions, configurationSettings),
    УникальностьКоманды: exportBooleanToEnterprise(data.commandUniqueness, configurationSettings),
    Фигура: exportSystemEnumerationToEnterprise(data.shape, SE.ButtonShapeToEnterprise, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    ЦветТекста: exportColorToEnterprise(data.textColor, configurationSettings),
    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "Button", exportButtonToEnterprise)
