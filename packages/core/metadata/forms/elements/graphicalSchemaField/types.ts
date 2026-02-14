import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureEnterprise } from "~/metadata/commonObjects/picture/types"
import { TypeDescription, TypeDescriptionEnterprise } from "~/metadata/commonObjects/typeDescription/types"
import { UserVisible, UserVisibleEnterprise } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { NamedElement } from "../baseElement/types"
import { ContextMenu, ContextMenuEnterprise } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "../extendedTooltip/types"

export interface GraphicalSchemaField extends NamedElement {
  itemType: "GraphicalSchemaField"
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
  verticalAlign?: SE.ItemVerticalAlign
  verticalAlignInGroup?: SE.ItemVerticalAlign
  visible?: boolean
  warningOnEdit?: I8nText
  warningOnEditRepresentation?: SE.WarningOnEditRepresentation
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  borderColor?: Color
  edit?: boolean
  height?: number
  horizontalStretch?: boolean
  maxHeight?: number
  maxWidth?: number
  output?: SE.UseOutput
  userVisible?: UserVisible
  verticalStretch?: boolean
  width?: number
  events?: {
    onChange?: string
    selection?: string
    beforeWrite?: string
    beforePrint?: string
    afterWrite?: string
    onActivate?: string
  }
}

export interface GraphicalSchemaFieldPartialEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  Вывод?: SE.UseOutputEnterprise
  Высота?: number
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  Редактирование?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  Ширина?: number
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
    Выбор?: string
    ПередЗаписью?: string
    ПередПечатью?: string
    ПослеЗаписи?: string
    ПриАктивизации?: string
  }
}
