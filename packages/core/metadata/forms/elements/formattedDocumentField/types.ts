import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { ColorYAML } from "~/metadata/commonObjects/color/types"
import { FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { PictureYAML } from "~/metadata/commonObjects/picture/types"
import { TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ContextMenuYAML } from "../contextMenu/types"
import { ExtendedTooltipYAML } from "../extendedTooltip/types"
import { FormattedDocumentFieldRules } from "./rules"

export type FormattedDocumentField = FormTypeByRule<typeof FormattedDocumentFieldRules>

export interface FormattedDocumentFieldPartialYAML {
  АвтоМаксимальнаяВысота?: StringboolYAML
  АвтоМаксимальнаяШирина?: StringboolYAML
  Вывод?: SE.UseOutputYAML
  ВыделенныйТекст?: string
  Высота?: number
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  РастягиватьПоВертикали?: StringboolYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  ЦветРамки?: ColorYAML
  ЦветТекста?: ColorYAML
  ЦветФона?: ColorYAML
  Ширина?: number
  Шрифт?: FontYAML
  АвтоВысотаЯчейки?: StringboolYAML
  АктивизироватьПоУмолчанию?: StringboolYAML
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  ВертикальноеПоложение?: SE.ItemVerticalAlignYAML
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
  Вид?: SE.FormFieldTypeYAML
  Видимость?: StringboolYAML
  ВысотаЗаголовка?: number
  ГиперссылкаЯчейки?: StringboolYAML
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationYAML
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
  ГоризонтальноеПоложениеВПодвале?: SE.ItemHorizontalLocationYAML
  ГоризонтальноеПоложениеВШапке?: SE.ItemHorizontalLocationYAML
  Доступность?: StringboolYAML
  Заголовок?: I8nTextYAML
  КартинкаПодвала?: PictureYAML
  КартинкаШапки?: PictureYAML
  КонтекстноеМеню?: ContextMenuYAML
  ОграничениеТипа?: TypeDescriptionYAML
  ОтображатьВПодвале?: StringboolYAML
  ОтображатьВШапке?: StringboolYAML
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  ОтображениеПредупрежденияПриРедактировании?: SE.WarningOnEditRepresentationYAML
  Подсказка?: I8nTextYAML
  ПоложениеЗаголовка?: SE.FormItemTitleLocationYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  ПредупреждениеПриРедактировании?: I8nTextYAML
  ПропускатьПриВводе?: StringboolYAML
  ПутьКДанным?: string
  ПутьКДаннымПодвала?: string
  РасширеннаяПодсказка?: ExtendedTooltipYAML
  РежимРедактирования?: SE.ColumnEditModeYAML
  СочетаниеКлавиш?: string
  Таблица?: string
  ТекстПодвала?: I8nTextYAML
  ТолькоПросмотр?: StringboolYAML
  ФиксацияВТаблице?: SE.FixingInTableYAML
  ЦветТекстаЗаголовка?: ColorYAML
  ЦветТекстаПодвала?: ColorYAML
  ЦветФонаЗаголовка?: ColorYAML
  ЦветФонаПодвала?: ColorYAML
  ШрифтЗаголовка?: FontYAML
  ШрифтПодвала?: FontYAML
  События?: {
    ПриИзменении?: string
    ПередЗаписью?: string
    ПередПечатью?: string
    ПослеЗаписи?: string
  }
}

export type FormattedDocumentFieldEnterprise = EnterpriseType<typeof FormattedDocumentFieldRules>
