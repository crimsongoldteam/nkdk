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
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportFormFieldToEnterprise = (
  data: FormField | undefined,
  configurationSettings: ConfigurationSettings
): FormFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportBaseElementToEnterprise(data, configurationSettings)!,

    АвтоВысотаЯчейки: exportBooleanToEnterprise(data.autoCellHeight, configurationSettings),
    ГиперссылкаЯчейки: exportBooleanToEnterprise(data.cellHyperlink, configurationSettings),
    КонтекстноеМеню: exportCommandBarToEnterprise(data.contextMenu, configurationSettings),
    ПутьКДанным: data.dataPath,
    АктивизироватьПоУмолчанию: exportBooleanToEnterprise(data.defaultItem, configurationSettings),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise,
      configurationSettings
    ),
    РежимРедактирования: exportSystemEnumerationToEnterprise(
      data.editMode,
      SE.ColumnEditModeToEnterprise,
      configurationSettings
    ),
    Доступность: exportBooleanToEnterprise(data.enabled, configurationSettings),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(data.extendedTooltip, configurationSettings),
    ФиксацияВТаблице: exportSystemEnumerationToEnterprise(
      data.fixingInTable,
      SE.FixingInTableToEnterprise,
      configurationSettings
    ),
    ЦветФонаПодвала: exportColorToEnterprise(data.footerBackColor, configurationSettings),
    ПутьКДаннымПодвала: data.footerDataPath,
    ШрифтПодвала: exportFontToEnterprise(data.footerFont, configurationSettings),
    ГоризонтальноеПоложениеВПодвале: exportSystemEnumerationToEnterprise(
      data.footerHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    КартинкаПодвала: exportPictureToEnterprise(data.footerPicture, configurationSettings),
    ТекстПодвала: exportI8nTextToEnterprise(data.footerText, configurationSettings),
    ЦветТекстаПодвала: exportColorToEnterprise(data.footerTextColor, configurationSettings),
    ГоризонтальноеПоложениеВШапке: exportSystemEnumerationToEnterprise(
      data.headerHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    КартинкаШапки: exportPictureToEnterprise(data.headerPicture, configurationSettings),
    ГоризонтальноеПоложение: exportSystemEnumerationToEnterprise(
      data.horizontalAlign,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    ТолькоПросмотр: exportBooleanToEnterprise(data.readOnly, configurationSettings),
    СочетаниеКлавиш: data.shortcut,
    ОтображатьВПодвале: exportBooleanToEnterprise(data.showInFooter, configurationSettings),
    ОтображатьВШапке: exportBooleanToEnterprise(data.showInHeader, configurationSettings),
    ПропускатьПриВводе: exportBooleanToEnterprise(data.skipOnInput, configurationSettings),
    Таблица: exportTableToEnterprise(data.table, configurationSettings),
    Заголовок: exportI8nTextToEnterprise(data.title, configurationSettings),
    ЦветФонаЗаголовка: exportColorToEnterprise(data.titleBackColor, configurationSettings),
    ШрифтЗаголовка: exportFontToEnterprise(data.titleFont, configurationSettings),
    ВысотаЗаголовка: data.titleHeight,
    ПоложениеЗаголовка: exportSystemEnumerationToEnterprise(
      data.titleLocation,
      SE.FormItemTitleLocationToEnterprise,
      configurationSettings
    ),
    ЦветТекстаЗаголовка: exportColorToEnterprise(data.titleTextColor, configurationSettings),
    Подсказка: exportI8nTextToEnterprise(data.toolTip, configurationSettings),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise,
      configurationSettings
    ),
    Вид: exportSystemEnumerationToEnterprise(data.type, SE.FormFieldTypeToEnterprise, configurationSettings),
    ОграничениеТипа: exportTypeDescriptionToEnterprise(data.typeRestriction, configurationSettings),
    ВертикальноеПоложение: exportSystemEnumerationToEnterprise(
      data.verticalAlign,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
    Видимость: exportBooleanToEnterprise(data.visible, configurationSettings),
    ПредупреждениеПриРедактировании: exportI8nTextToEnterprise(data.warningOnEdit, configurationSettings),
    ОтображениеПредупрежденияПриРедактировании: exportSystemEnumerationToEnterprise(
      data.warningOnEditRepresentation,
      SE.WarningOnEditRepresentationToEnterprise,
      configurationSettings
    ),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    Events: exportEventsToEnterprise(data.events, configurationSettings),
  }
}

registerMetadata("ExportToEnterprise", "FormField", exportFormFieldToEnterprise)
