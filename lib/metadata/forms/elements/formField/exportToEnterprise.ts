import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/lib/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
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
  context: Context,
  data: FormField | undefined
): FormFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToEnterprise(context, data)!,

    АвтоВысотаЯчейки: exportBooleanToEnterprise(context, data.autoCellHeight),
    АктивизироватьПоУмолчанию: exportBooleanToEnterprise(context, data.defaultItem),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      context,
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    ВертикальноеПоложение: exportSystemEnumerationToEnterprise(
      context,
      data.verticalAlign,
      SE.ItemVerticalAlignToEnterprise
    ),
    ВертикальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      context,
      data.verticalAlignInGroup,
      SE.ItemVerticalAlignToEnterprise
    ),
    Вид: exportSystemEnumerationToEnterprise(context, data.type, SE.FormFieldTypeToEnterprise),
    Видимость: exportBooleanToEnterprise(context, data.visible),
    ВысотаЗаголовка: data.titleHeight,
    ГиперссылкаЯчейки: exportBooleanToEnterprise(context, data.cellHyperlink),
    ГоризонтальноеПоложение: exportSystemEnumerationToEnterprise(
      context,
      data.horizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ГоризонтальноеПоложениеВГруппе: exportSystemEnumerationToEnterprise(
      context,
      data.horizontalAlignInGroup,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ГоризонтальноеПоложениеВПодвале: exportSystemEnumerationToEnterprise(
      context,
      data.footerHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ГоризонтальноеПоложениеВШапке: exportSystemEnumerationToEnterprise(
      context,
      data.headerHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    Доступность: exportBooleanToEnterprise(context, data.enabled),
    Заголовок: exportI8nTextToEnterprise(context, data.title),
    КартинкаПодвала: exportPictureToEnterprise(context, data.footerPicture),
    КартинкаШапки: exportPictureToEnterprise(context, data.headerPicture),
    КонтекстноеМеню: exportCommandBarToEnterprise(context, data.contextMenu),
    ОграничениеТипа: exportTypeDescriptionToEnterprise(context, data.typeRestriction),
    ОтображатьВПодвале: exportBooleanToEnterprise(context, data.showInFooter),
    ОтображатьВШапке: exportBooleanToEnterprise(context, data.showInHeader),
    ОтображениеПодсказки: exportSystemEnumerationToEnterprise(
      context,
      data.toolTipRepresentation,
      SE.ToolTipRepresentationToEnterprise
    ),
    ОтображениеПредупрежденияПриРедактировании: exportSystemEnumerationToEnterprise(
      context,
      data.warningOnEditRepresentation,
      SE.WarningOnEditRepresentationToEnterprise
    ),
    Подсказка: exportI8nTextToEnterprise(context, data.toolTip),
    ПоложениеЗаголовка: exportSystemEnumerationToEnterprise(
      context,
      data.titleLocation,
      SE.FormItemTitleLocationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    ПредупреждениеПриРедактировании: exportI8nTextToEnterprise(context, data.warningOnEdit),
    ПропускатьПриВводе: exportBooleanToEnterprise(context, data.skipOnInput),
    ПутьКДанным: data.dataPath,
    ПутьКДаннымПодвала: data.footerDataPath,
    РасширеннаяПодсказка: exportFormDecorationToEnterprise(context, data.extendedTooltip),
    РежимРедактирования: exportSystemEnumerationToEnterprise(context, data.editMode, SE.ColumnEditModeToEnterprise),
    СочетаниеКлавиш: data.shortcut,
    Таблица: exportTableToEnterprise(context, data.table),
    ТекстПодвала: exportI8nTextToEnterprise(context, data.footerText),
    ТолькоПросмотр: exportBooleanToEnterprise(context, data.readOnly),
    ФиксацияВТаблице: exportSystemEnumerationToEnterprise(context, data.fixingInTable, SE.FixingInTableToEnterprise),
    ЦветТекстаЗаголовка: exportColorToEnterprise(context, data.titleTextColor),
    ЦветТекстаПодвала: exportColorToEnterprise(context, data.footerTextColor),
    ЦветФонаЗаголовка: exportColorToEnterprise(context, data.titleBackColor),
    ЦветФонаПодвала: exportColorToEnterprise(context, data.footerBackColor),
    ШрифтЗаголовка: exportFontToEnterprise(context, data.titleFont),
    ШрифтПодвала: exportFontToEnterprise(context, data.footerFont),
    События: exportEventsToEnterprise(context, data.events),
  })
}

registerMetadata("ExportToEnterprise", "FormField", exportFormFieldToEnterprise)
