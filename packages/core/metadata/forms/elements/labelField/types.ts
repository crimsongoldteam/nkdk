import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderPreview, BorderYAML } from "~/metadata/commonObjects/border/types"
import { Color, ColorPreview, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontPreview, FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PicturePreview, PictureYAML } from "~/metadata/commonObjects/picture/types"
import { TypeDescription, TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { UserVisible, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { ContextMenu, ContextMenuYAML } from "~/metadata/forms/elements/contextMenu/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { SystemEnumerationPreview } from "~/metadata/systemEnumerations/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "../extendedTooltip/types"

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

export interface LabelFieldPartialYAML {
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
  АвтоМаксимальнаяВысота?: StringboolYAML
  АвтоМаксимальнаяШирина?: StringboolYAML
  ВыделятьОтрицательные?: StringboolYAML
  Высота?: number
  Гиперссылка?: StringboolYAML
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  Рамка?: BorderYAML
  РастягиватьПоВертикали?: StringboolYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  РежимПароля?: StringboolYAML
  Формат?: I8nTextYAML
  ЦветРамки?: ColorYAML
  ЦветТекста?: ColorYAML
  ЦветФона?: ColorYAML
  Ширина?: number
  Шрифт?: FontYAML
  События?: {
    ПриИзменении?: string
    Нажатие?: string
    ОбработкаНавигационнойСсылки?: string
  }
}

export interface LabelFieldTypedYAML extends LabelFieldPartialYAML {
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
export type LabelFieldYAML = LabelFieldPartialYAML
