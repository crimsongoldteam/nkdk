import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import { TypeDescriptionEnterprise, TypeDescriptionXML } from "~/metadata/commonObjects/typeDescription/types"
import { UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { BaseElementXML, NamedElement } from "../baseElement/types"
import { ContextMenuEnterprise, ContextMenuXML } from "../contextMenu/types"
import { ExtendedTooltipEnterprise, ExtendedTooltipXML } from "../extendedTooltip/types"

export interface FormattedDocumentField extends NamedElement {
  elementType: "FormattedDocumentField"
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  backColor?: Color
  borderColor?: Color
  font?: Font
  height?: number
  horizontalStretch?: boolean
  maxHeight?: number
  maxWidth?: number
  output?: SE.UseOutput
  selectedText?: string
  textColor?: Color
  verticalStretch?: boolean
  width?: number
  events?: {
    onChange?: string
    beforeWrite?: string
    beforePrint?: string
    afterWrite?: string
  }
}

export interface FormattedDocumentFieldXML extends BaseElementXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  BackColor?: ColorXML
  BorderColor?: ColorXML
  Font?: FontXML
  Height?: number
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxWidth?: number
  Output?: SE.UseOutput
  SelectedText?: string
  TextColor?: ColorXML
  UserVisible?: UserVisibleXML
  VerticalStretch?: boolean
  Width?: number
  AutoCellHeight?: boolean
  CellHyperlink?: boolean
  ContextMenu: ContextMenuXML
  DataPath?: string
  DefaultItem?: boolean
  _DisplayImportance?: SE.DisplayImportance
  EditMode?: SE.ColumnEditMode
  Enabled?: boolean
  ExtendedTooltip: ExtendedTooltipXML
  FixingInTable?: SE.FixingInTable
  FooterBackColor?: ColorXML
  FooterDataPath?: string
  FooterFont?: FontXML
  FooterHorizontalAlign?: SE.ItemHorizontalLocation
  FooterPicture?: PictureXML
  FooterText?: I8nTextXML
  FooterTextColor?: ColorXML
  HeaderHorizontalAlign?: SE.ItemHorizontalLocation
  HeaderPicture?: PictureXML
  HorizontalAlign?: SE.ItemHorizontalLocation
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation
  ReadOnly?: boolean
  Shortcut?: string
  ShowInFooter?: boolean
  ShowInHeader?: boolean
  SkipOnInput?: boolean
  AssociatedTableElementId?: MetadataValueXML
  Title?: I8nTextXML
  TitleBackColor?: ColorXML
  TitleFont?: FontXML
  TitleHeight?: number
  TitleLocation?: SE.FormItemTitleLocation
  TitleTextColor?: ColorXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormFieldType
  TypeRestriction?: TypeDescriptionXML
  VerticalAlign?: SE.ItemVerticalAlign
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  Visible?: boolean
  WarningOnEdit?: I8nTextXML
  WarningOnEditRepresentation?: SE.WarningOnEditRepresentation
  Events?: EventsXML
}

export interface FormattedDocumentFieldPartialEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  Вывод?: SE.UseOutputEnterprise
  ВыделенныйТекст?: string
  Высота?: number
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
  АвтоВысотаЯчейки?: StringboolEnterprise
  АктивизироватьПоУмолчанию?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальноеПоложение?: SE.ItemVerticalAlignEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Вид?: SE.FormFieldTypeEnterprise
  Видимость?: StringboolEnterprise
  ВысотаЗаголовка?: number
  ГиперссылкаЯчейки?: StringboolEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальноеПоложениеВПодвале?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальноеПоложениеВШапке?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  КартинкаПодвала?: PictureEnterprise
  КартинкаШапки?: PictureEnterprise
  КонтекстноеМеню?: ContextMenuEnterprise
  ОграничениеТипа?: TypeDescriptionEnterprise
  ОтображатьВПодвале?: StringboolEnterprise
  ОтображатьВШапке?: StringboolEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  ОтображениеПредупрежденияПриРедактировании?: SE.WarningOnEditRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  ПоложениеЗаголовка?: SE.FormItemTitleLocationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ПредупреждениеПриРедактировании?: I8nTextEnterprise
  ПропускатьПриВводе?: StringboolEnterprise
  ПутьКДанным?: string
  ПутьКДаннымПодвала?: string
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  РежимРедактирования?: SE.ColumnEditModeEnterprise
  СочетаниеКлавиш?: string
  Таблица?: string
  ТекстПодвала?: I8nTextEnterprise
  ТолькоПросмотр?: StringboolEnterprise
  ФиксацияВТаблице?: SE.FixingInTableEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  ЦветТекстаПодвала?: ColorEnterprise
  ЦветФонаЗаголовка?: ColorEnterprise
  ЦветФонаПодвала?: ColorEnterprise
  ШрифтЗаголовка?: FontEnterprise
  ШрифтПодвала?: FontEnterprise
  События?: {
    ПриИзменении?: string
    ПередЗаписью?: string
    ПередПечатью?: string
    ПослеЗаписи?: string
  }
}

export interface FormattedDocumentFieldTypedEnterprise extends FormattedDocumentFieldPartialEnterprise {
  Тип: "ПолеФорматированногоДокумента"
}

// Для обратной совместимости
export type FormattedDocumentFieldEnterprise = FormattedDocumentFieldPartialEnterprise
