import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/lib/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportBaseElementToEnterprise } from "~/lib/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportCommandBarToEnterprise } from "~/lib/metadata/forms/elements/commandBar/exportToEnterprise"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { FormField, FormFieldEnterprise } from "~/lib/metadata/forms/elements/formField/types"
import { exportTableToEnterprise } from "~/lib/metadata/forms/elements/table/exportToEnterprise"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportFormFieldToEnterprise = (
  configurationSettings: ConfigurationSettings,
  data: FormField | undefined
): FormFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(configurationSettings, data)!,

    АвтоВысотаЯчейки: exportBooleanToEnterprise(configurationSettings, data.autoCellHeight),
    АктивизироватьПоУмолчанию: exportBooleanToEnterprise(configurationSettings, data.defaultItem),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    ВертикальноеПоложение: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.verticalAlign,
      SE.ItemVerticalAlignToEnterprise
    ),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise
    ),
    Вид: exportSystemEnumerationToEnterprise(configurationSettings, data.type, SE.FormFieldTypeToEnterprise),
    Видимость: exportBooleanToEnterprise(configurationSettings, data.visible),
    ВысотаЗаголовка: data.titleHeight,
    ГиперссылкаЯчейки: exportBooleanToEnterprise(configurationSettings, data.cellHyperlink),
    ГоризонтальноеПоложение: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.horizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ГоризонтальноеПоложениеВПодвале: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.footerHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ГоризонтальноеПоложениеВШапке: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.headerHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    Доступность: exportBooleanToEnterprise(configurationSettings, data.enabled),
    Заголовок: exportI8nTextToEnterprise(configurationSettings, data.title),
    КартинкаПодвала: exportPictureToEnterprise(configurationSettings, data.footerPicture),
    КартинкаШапки: exportPictureToEnterprise(configurationSettings, data.headerPicture),
    КонтекстноеМеню: exportCommandBarToEnterprise(configurationSettings, data.contextMenu),
    ОграничениеТипа: exportTypeDescriptionToEnterprise(configurationSettings, data.typeRestriction),
    ОтображатьВПодвале: exportBooleanToEnterprise(configurationSettings, data.showInFooter),
    ОтображатьВШапке: exportBooleanToEnterprise(configurationSettings, data.showInHeader),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    ОтображениеПредупрежденияПриРедактировании: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.warningOnEditRepresentation,
      SE.WarningOnEditRepresentationToEnterprise
    ),
    Подсказка: exportI8nTextToEnterprise(configurationSettings, data.toolTip),
    ПоложениеЗаголовка: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.titleLocation,
      SE.FormItemTitleLocationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    ПредупреждениеПриРедактировании: exportI8nTextToEnterprise(configurationSettings, data.warningOnEdit),
    ПропускатьПриВводе: exportBooleanToEnterprise(configurationSettings, data.skipOnInput),
    ПутьКДанным: data.dataPath,
    ПутьКДаннымПодвала: data.footerDataPath,
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(configurationSettings, data.extendedTooltip),
    РежимРедактирования: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.editMode,
      SE.ColumnEditModeToEnterprise
    ),
    СочетаниеКлавиш: data.shortcut,
    Таблица: exportTableToEnterprise(configurationSettings, data.table),
    ТекстПодвала: exportI8nTextToEnterprise(configurationSettings, data.footerText),
    ТолькоПросмотр: exportBooleanToEnterprise(configurationSettings, data.readOnly),
    ФиксацияВТаблице: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.fixingInTable,
      SE.FixingInTableToEnterprise
    ),
    ЦветТекстаЗаголовка: exportColorToEnterprise(configurationSettings, data.titleTextColor),
    ЦветТекстаПодвала: exportColorToEnterprise(configurationSettings, data.footerTextColor),
    ЦветФонаЗаголовка: exportColorToEnterprise(configurationSettings, data.titleBackColor),
    ЦветФонаПодвала: exportColorToEnterprise(configurationSettings, data.footerBackColor),
    ШрифтЗаголовка: exportFontToEnterprise(configurationSettings, data.titleFont),
    ШрифтПодвала: exportFontToEnterprise(configurationSettings, data.footerFont),
    События: exportEventsToEnterprise(configurationSettings, data.events),
  })
}

registerMetadata("ExportToEnterprise", "FormField", exportFormFieldToEnterprise)
