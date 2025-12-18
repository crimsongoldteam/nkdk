import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportBaseElementToEnterprise } from "~/lib/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportCommandBarToEnterprise } from "~/lib/metadata/forms/elements/commandBar/exportToEnterprise"
import { FormDecoration, FormDecorationEnterprise } from "~/lib/metadata/forms/elements/formDecoration/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportFormDecorationToEnterprise = (
  data: FormDecoration | undefined,
  configurationSettings: ConfigurationSettings
): FormDecorationEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(data, configurationSettings)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight, configurationSettings),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
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
    Вид: exportSystemEnumerationToEnterprise(data.type, SE.FormDecorationTypeToEnterprise, configurationSettings),
    Видимость: exportBooleanToEnterprise(data.visible, configurationSettings),
    Высота: data.height,
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    Доступность: exportBooleanToEnterprise(data.enabled, configurationSettings),
    Заголовок: exportI8nTextToEnterprise(data.title, configurationSettings),
    КонтекстноеМеню: exportCommandBarToEnterprise(data.contextMenu, configurationSettings),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise,
      configurationSettings
    ),
    Подсказка: exportI8nTextToEnterprise(data.toolTip, configurationSettings),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    ПропускатьПриВводе: exportBooleanToEnterprise(data.skipOnInput, configurationSettings),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(data.extendedTooltip, configurationSettings),
    СочетаниеКлавиш: data.shortcut,
    ЦветТекста: exportColorToEnterprise(data.textColor, configurationSettings),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "FormDecoration", exportFormDecorationToEnterprise)
