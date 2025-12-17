import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/lib/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportBaseElementToEnterprise } from "~/lib/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportCommandBarToEnterprise } from "~/lib/metadata/forms/elements/commandBar/exportToEnterprise"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { FormField, FormFieldEnterprise } from "~/lib/metadata/forms/elements/formField/types"
import { exportTableToEnterprise } from "~/lib/metadata/forms/elements/table/exportToEnterprise"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportFormFieldToEnterprise = (data: FormField | undefined): FormFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportBaseElementToEnterprise(data)!,

    АвтоВысотаЯчейки: exportBooleanToEnterprise(data.autoCellHeight),
    ГиперссылкаЯчейки: exportBooleanToEnterprise(data.cellHyperlink),
    КонтекстноеМеню: exportCommandBarToEnterprise(data.contextMenu),
    ПутьКДанным: data.dataPath,
    АктивизироватьПоУмолчанию: exportBooleanToEnterprise(data.defaultItem),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    РежимРедактирования: exportSystemEnumerationToEnterprise(data.editMode, SE.ColumnEditModeToEnterprise),
    Доступность: exportBooleanToEnterprise(data.enabled),
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(data.extendedTooltip),
    ФиксацияВТаблице: exportSystemEnumerationToEnterprise(data.fixingInTable, SE.FixingInTableToEnterprise),
    ЦветФонаПодвала: exportColorToEnterprise(data.footerBackColor),
    ПутьКДаннымПодвала: data.footerDataPath,
    ШрифтПодвала: exportFontToEnterprise(data.footerFont),
    ГоризонтальноеПоложениеВПодвале: exportSystemEnumerationToEnterprise(
      data.footerHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    КартинкаПодвала: exportPictureToEnterprise(data.footerPicture),
    ТекстПодвала: exportI8nTextToEnterprise(data.footerText),
    ЦветТекстаПодвала: exportColorToEnterprise(data.footerTextColor),
    ГоризонтальноеПоложениеВШапке: exportSystemEnumerationToEnterprise(
      data.headerHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    КартинкаШапки: exportPictureToEnterprise(data.headerPicture),
    ГоризонтальноеПоложение: exportSystemEnumerationToEnterprise(
      data.horizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ТолькоПросмотр: exportBooleanToEnterprise(data.readOnly),
    СочетаниеКлавиш: data.shortcut,
    ОтображатьВПодвале: exportBooleanToEnterprise(data.showInFooter),
    ОтображатьВШапке: exportBooleanToEnterprise(data.showInHeader),
    ПропускатьПриВводе: exportBooleanToEnterprise(data.skipOnInput),
    Таблица: exportTableToEnterprise(data.table),
    Заголовок: exportI8nTextToEnterprise(data.title),
    ЦветФонаЗаголовка: exportColorToEnterprise(data.titleBackColor),
    ШрифтЗаголовка: exportFontToEnterprise(data.titleFont),
    ВысотаЗаголовка: data.titleHeight,
    ПоложениеЗаголовка: exportSystemEnumerationToEnterprise(data.titleLocation, SE.FormItemTitleLocationToEnterprise),
    ЦветТекстаЗаголовка: exportColorToEnterprise(data.titleTextColor),
    Подсказка: exportI8nTextToEnterprise(data.toolTip),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    Вид: exportSystemEnumerationToEnterprise(data.type, SE.FormFieldTypeToEnterprise),
    ОграничениеТипа: exportTypeDescriptionToEnterprise(data.typeRestriction),
    ВертикальноеПоложение: exportSystemEnumerationToEnterprise(data.verticalAlign, SE.ItemVerticalAlignToEnterprise),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise
    ),
    Видимость: exportBooleanToEnterprise(data.visible),
    ПредупреждениеПриРедактировании: exportI8nTextToEnterprise(data.warningOnEdit),
    ОтображениеПредупрежденияПриРедактировании: exportSystemEnumerationToEnterprise(
      data.warningOnEditRepresentation,
      SE.WarningOnEditRepresentationToEnterprise
    ),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.FormField, exportFormFieldToEnterprise)
