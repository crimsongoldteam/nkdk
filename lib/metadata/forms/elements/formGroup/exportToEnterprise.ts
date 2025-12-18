import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportBaseElementToEnterprise } from "~/lib/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportChildItemsToEnterprise } from "~/lib/metadata/forms/elements/childItems/exportToEnterprise"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { FormGroup, FormGroupEnterprise } from "~/lib/metadata/forms/elements/formGroup/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportFormGroupToEnterprise = (
  data: FormGroup | undefined,
  configurationSettings: ConfigurationSettings
): FormGroupEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(data, configurationSettings)!,

    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
    Вид: exportSystemEnumerationToEnterprise(data.type, SE.FormGroupTypeToEnterprise, configurationSettings),
    Видимость: exportBooleanToEnterprise(data.visible, configurationSettings),
    Высота: data.height,
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    Доступность: exportBooleanToEnterprise(data.enabled, configurationSettings),
    Заголовок: exportI8nTextToEnterprise(data.title, configurationSettings),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise,
      configurationSettings
    ),
    Подсказка: exportI8nTextToEnterprise(data.toolTip, configurationSettings),
    ПодчиненныеЭлементы: exportChildItemsToEnterprise(data.childItems, configurationSettings),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    РазрешитьИзменениеСостава: exportBooleanToEnterprise(data.enableContentChange, configurationSettings),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(data.extendedTooltip, configurationSettings),
    СочетаниеКлавиш: data.shortcut,
    ТолькоПросмотр: exportBooleanToEnterprise(data.readOnly, configurationSettings),
    ЦветТекстаЗаголовка: exportColorToEnterprise(data.titleTextColor, configurationSettings),
    Ширина: data.width,
    ШрифтЗаголовка: exportFontToEnterprise(data.titleFont, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "FormGroup", exportFormGroupToEnterprise)
