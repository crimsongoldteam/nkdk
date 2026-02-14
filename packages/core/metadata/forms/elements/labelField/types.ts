import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderPreview } from "~/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorPreview } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontPreview } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureEnterprise, PicturePreview } from "~/metadata/commonObjects/picture/types"
import { TypeDescription, TypeDescriptionEnterprise } from "~/metadata/commonObjects/typeDescription/types"
import { UserVisible, UserVisibleEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ContextMenu, ContextMenuEnterprise } from "~/metadata/forms/elements/contextMenu/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { SystemEnumerationPreview } from "~/metadata/systemEnumerations/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "../extendedTooltip/types"

export interface LabelField {
  itemType: "LabelField"
  name: string
  autoCellHeight?: boolean
  cellHyperlink?: boolean
  contextMenu?: ContextMenu
  dataPath?: string
  defaultItem?: boolean
  displayImportance?: SE.DisplayImportance
  editMode?: SE.ColumnEditMode
  enabled?: boolean
  extendedTooltip?: ExtendedTooltip
  fixingInTable?: SE.FixingInTable
  footerBackColor?: Color
  footerDataPath?: string
  footerFont?: Font
  footerHorizontalAlign?: SE.ItemHorizontalLocation
  footerPicture?: Picture
  footerText?: I8nText
  footerTextColor?: Color
  headerHorizontalAlign?: SE.ItemHorizontalLocation
  headerPicture?: Picture
  horizontalAlign?: SE.ItemHorizontalLocation
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  readOnly?: boolean
  shortcut?: string
  showInFooter?: boolean
  showInHeader?: boolean
  skipOnInput?: boolean
  table?: string
  title?: I8nText
  titleBackColor?: Color
  titleFont?: Font
  titleHeight?: number
  titleLocation?: SE.FormItemTitleLocation
  titleTextColor?: Color
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  type?: SE.FormFieldType
  typeRestriction?: TypeDescription
  userVisible?: UserVisible
  verticalAlign?: SE.ItemVerticalAlign
  verticalAlignInGroup?: SE.ItemVerticalAlign
  visible?: boolean
  warningOnEdit?: I8nText
  warningOnEditRepresentation?: SE.WarningOnEditRepresentation
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  backColor?: Color
  border?: Border
  borderColor?: Color
  font?: Font
  format?: I8nText
  height?: number
  horizontalStretch?: boolean
  hyperlink?: boolean
  markNegatives?: boolean
  maxHeight?: number
  maxWidth?: number
  passwordMode?: boolean
  textColor?: Color
  verticalStretch?: boolean
  width?: number
  events?: {
    onChange?: string
    click?: string
    uRLProcessing?: string
  }
}

export interface LabelFieldPartialEnterprise {
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
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ВыделятьОтрицательные?: StringboolEnterprise
  Высота?: number
  Гиперссылка?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  Рамка?: BorderEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  РежимПароля?: StringboolEnterprise
  Формат?: I8nTextEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
  События?: {
    ПриИзменении?: string
    Нажатие?: string
    ОбработкаНавигационнойСсылки?: string
  }
}

export interface LabelFieldTypedEnterprise extends LabelFieldPartialEnterprise {
  Тип: "ПолеНадписи"
}

export interface LabelFieldPreview {
  itemType: "FormField"
  Name: string
  Type: SystemEnumerationPreview
  AutoCellHeight?: boolean
  CellHyperlink?: boolean
  DataPath?: string
  DefaultItem?: boolean
  DisplayImportance?: SystemEnumerationPreview
  EditMode?: SystemEnumerationPreview
  Enabled?: boolean
  FixingInTable?: SystemEnumerationPreview
  FooterBackColor?: ColorPreview
  FooterDataPath?: string
  FooterFont?: FontPreview
  FooterHorizontalAlign?: SystemEnumerationPreview
  FooterPicture?: PicturePreview
  FooterText?: string
  FooterTextColor?: ColorPreview
  HeaderHorizontalAlign?: SystemEnumerationPreview
  HeaderPicture?: PicturePreview
  HorizontalAlign?: SystemEnumerationPreview
  HorizontalAlignInGroup?: SystemEnumerationPreview
  ReadOnly?: boolean
  ShowInFooter?: boolean
  ShowInHeader?: boolean
  SkipOnInput?: boolean
  Title?: string
  TitleBackColor?: ColorPreview
  TitleFont?: FontPreview
  TitleHeight?: number
  TitleLocation?: SystemEnumerationPreview
  TitleTextColor?: ColorPreview
  ToolTip?: string
  ToolTipRepresentation?: SystemEnumerationPreview
  VerticalAlign?: SystemEnumerationPreview
  VerticalAlignInGroup?: SystemEnumerationPreview
  Visible?: boolean
  WarningOnEdit?: string
  WarningOnEditRepresentation?: SystemEnumerationPreview
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  BackColor?: ColorPreview
  Border?: BorderPreview
  BorderColor?: ColorPreview
  Font?: FontPreview
  Format?: string
  Height?: number
  HorizontalStretch?: boolean
  Hyperlink?: boolean
  MarkNegatives?: boolean
  MaxHeight?: number
  MaxWidth?: number
  PasswordMode?: boolean
  TextColor?: ColorPreview
  VerticalStretch?: boolean
  Width?: number
}

// Для обратной совместимости
export type LabelFieldEnterprise = LabelFieldPartialEnterprise
