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
  configurationSettings: ConfigurationSettings,
  data: FormGroup | undefined
): FormGroupEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(configurationSettings, data)!,

    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(configurationSettings, data.verticalAlignInGroup, SE.ItemVerticalAlignToEnterprise),
    Вид: exportSystemEnumerationToEnterprise(configurationSettings, data.type, SE.FormGroupTypeToEnterprise),
    Видимость: exportBooleanToEnterprise(configurationSettings, data.visible),
    Высота: data.height,
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(configurationSettings, data.horizontalAlignInGroup, SE.ItemHorizontalLocationToEnterprise),
    Доступность: exportBooleanToEnterprise(configurationSettings, data.enabled),
    Заголовок: exportI8nTextToEnterprise(configurationSettings, data.title),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(configurationSettings, data.toolTipRepresentation, SE.ToolTipRepresentationToEnterprise),
    Подсказка: exportI8nTextToEnterprise(configurationSettings, data.toolTip),
    ПодчиненныеЭлементы: exportChildItemsToEnterprise(configurationSettings, data.childItems),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    РазрешитьИзменениеСостава: exportBooleanToEnterprise(configurationSettings, data.enableContentChange),
    РастягиватьПоВертикали: exportBooleanToEnterprise(configurationSettings, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(configurationSettings, data.horizontalStretch),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(configurationSettings, data.extendedTooltip),
    СочетаниеКлавиш: data.shortcut,
    ТолькоПросмотр: exportBooleanToEnterprise(configurationSettings, data.readOnly),
    ЦветТекстаЗаголовка: exportColorToEnterprise(configurationSettings, data.titleTextColor),
    Ширина: data.width,
    ШрифтЗаголовка: exportFontToEnterprise(configurationSettings, data.titleFont),
  })
}

registerMetadata("ExportToEnterprise", "FormGroup", exportFormGroupToEnterprise)
