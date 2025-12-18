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
  data: FormField | undefined,
  configurationSettings: ConfigurationSettings
): FormFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(data, configurationSettings)!,

    АвтоВысотаЯчейки: exportBooleanToEnterprise(data.autoCellHeight, configurationSettings),
    АктивизироватьПоУмолчанию: exportBooleanToEnterprise(data.defaultItem, configurationSettings),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise,
      configurationSettings
    ),
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
    Вид: exportSystemEnumerationToEnterprise(data.type, SE.FormFieldTypeToEnterprise, configurationSettings),
    Видимость: exportBooleanToEnterprise(data.visible, configurationSettings),
    ВысотаЗаголовка: data.titleHeight,
    ГиперссылкаЯчейки: exportBooleanToEnterprise(data.cellHyperlink, configurationSettings),
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
    ГоризонтальноеПоложениеВПодвале: exportSystemEnumerationToEnterprise(
      data.footerHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    ГоризонтальноеПоложениеВШапке: exportSystemEnumerationToEnterprise(
      data.headerHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    Доступность: exportBooleanToEnterprise(data.enabled, configurationSettings),
    Заголовок: exportI8nTextToEnterprise(data.title, configurationSettings),
    КартинкаПодвала: exportPictureToEnterprise(data.footerPicture, configurationSettings),
    КартинкаШапки: exportPictureToEnterprise(data.headerPicture, configurationSettings),
    КонтекстноеМеню: exportCommandBarToEnterprise(data.contextMenu, configurationSettings),
    ОграничениеТипа: exportTypeDescriptionToEnterprise(data.typeRestriction, configurationSettings),
    ОтображатьВПодвале: exportBooleanToEnterprise(data.showInFooter, configurationSettings),
    ОтображатьВШапке: exportBooleanToEnterprise(data.showInHeader, configurationSettings),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise,
      configurationSettings
    ),
    ОтображениеПредупрежденияПриРедактировании: exportSystemEnumerationToEnterprise(
      data.warningOnEditRepresentation,
      SE.WarningOnEditRepresentationToEnterprise,
      configurationSettings
    ),
    Подсказка: exportI8nTextToEnterprise(data.toolTip, configurationSettings),
    ПоложениеЗаголовка: exportSystemEnumerationToEnterprise(
      data.titleLocation,
      SE.FormItemTitleLocationToEnterprise,
      configurationSettings
    ),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    ПредупреждениеПриРедактировании: exportI8nTextToEnterprise(data.warningOnEdit, configurationSettings),
    ПропускатьПриВводе: exportBooleanToEnterprise(data.skipOnInput, configurationSettings),
    ПутьКДанным: data.dataPath,
    ПутьКДаннымПодвала: data.footerDataPath,
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(data.extendedTooltip, configurationSettings),
    РежимРедактирования: exportSystemEnumerationToEnterprise(
      data.editMode,
      SE.ColumnEditModeToEnterprise,
      configurationSettings
    ),
    СочетаниеКлавиш: data.shortcut,
    Таблица: exportTableToEnterprise(data.table, configurationSettings),
    ТекстПодвала: exportI8nTextToEnterprise(data.footerText, configurationSettings),
    ТолькоПросмотр: exportBooleanToEnterprise(data.readOnly, configurationSettings),
    ФиксацияВТаблице: exportSystemEnumerationToEnterprise(
      data.fixingInTable,
      SE.FixingInTableToEnterprise,
      configurationSettings
    ),
    ЦветТекстаЗаголовка: exportColorToEnterprise(data.titleTextColor, configurationSettings),
    ЦветТекстаПодвала: exportColorToEnterprise(data.footerTextColor, configurationSettings),
    ЦветФонаЗаголовка: exportColorToEnterprise(data.titleBackColor, configurationSettings),
    ЦветФонаПодвала: exportColorToEnterprise(data.footerBackColor, configurationSettings),
    ШрифтЗаголовка: exportFontToEnterprise(data.titleFont, configurationSettings),
    ШрифтПодвала: exportFontToEnterprise(data.footerFont, configurationSettings),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "FormField", exportFormFieldToEnterprise)
