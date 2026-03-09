import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderYAML } from "~/metadata/commonObjects/border/types"
import { Color, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontYAML } from "~/metadata/commonObjects/font/types"
import { FormattedI8nText, FormattedI8nTextYAML } from "~/metadata/commonObjects/formattedI8nText/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { ElementReferenceTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ContextMenu, ContextMenuYAML } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "../extendedTooltip/types"
import { LabelDecorationRules } from "./rules"

export type LabelDecorationReference = ElementReferenceTypeByRule<typeof LabelDecorationRules>

export interface LabelDecoration {
  itemType: "LabelDecoration"
  name: string
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  contextMenu?: ContextMenu
  displayImportance?: SE.DisplayImportance
  enabled?: boolean
  extendedTooltip?: ExtendedTooltip
  font?: Font
  height?: number
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  horizontalStretch?: boolean
  maxHeight?: number
  maxWidth?: number
  shortcut?: string
  skipOnInput?: boolean
  textColor?: Color
  title?: FormattedI8nText
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  type?: SE.FormDecorationType
  userVisible?: UserVisible
  verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalStretch?: boolean
  visible?: boolean
  width?: number
  backColor?: Color
  border?: Border
  borderColor?: Color
  groupVerticalAlign?: SE.ItemVerticalAlign
  horizontalAlign?: SE.ItemHorizontalLocation
  hyperlink?: boolean
  titleHeight?: number
  verticalAlign?: SE.ItemVerticalAlign
  events?: {
    click?: string
    uRLProcessing?: string
  }
}

export interface LabelDecorationPartialYAML {
  АвтоМаксимальнаяВысота?: StringboolYAML
  АвтоМаксимальнаяШирина?: StringboolYAML
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
  Вид?: SE.FormDecorationTypeYAML
  Видимость?: StringboolYAML
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
  Доступность?: StringboolYAML
  Заголовок?: FormattedI8nTextYAML
  ФорматированныйЗаголовок?: FormattedI8nTextYAML
  КонтекстноеМеню?: ContextMenuYAML
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  Подсказка?: I8nTextYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  ПропускатьПриВводе?: StringboolYAML
  РастягиватьПоВертикали?: StringboolYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  РасширеннаяПодсказка?: ExtendedTooltipYAML
  СочетаниеКлавиш?: string
  ЦветТекста?: ColorYAML
  Ширина?: number
  Шрифт?: FontYAML
  ВертикальноеВыравниваниеГруппы?: SE.ItemVerticalAlignYAML
  ВертикальноеПоложение?: SE.ItemVerticalAlignYAML
  ВысотаЗаголовка?: number
  Гиперссылка?: StringboolYAML
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationYAML
  Рамка?: BorderYAML
  ЦветРамки?: ColorYAML
  ЦветФона?: ColorYAML
  События?: {
    Нажатие?: string
    ОбработкаНавигационнойСсылки?: string
  }
}

export type LabelDecorationEnterprise = EnterpriseType<typeof LabelDecorationRules>
