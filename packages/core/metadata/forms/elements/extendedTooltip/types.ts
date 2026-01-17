import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import {
  FormattedI8nText,
  FormattedI8nTextEnterprise,
  FormattedI8nTextXML,
} from "~/metadata/commonObjects/formattedI8nText/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { BaseElementXML } from "../baseElement/types"

export interface ExtendedTooltip {
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  displayImportance?: SE.DisplayImportance
  enabled?: boolean
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
}

export interface ExtendedTooltipXML extends BaseElementXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  _DisplayImportance?: SE.DisplayImportance
  Enabled?: boolean
  Font?: FontXML
  Height?: number
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxWidth?: number
  Shortcut?: string
  SkipOnInput?: boolean
  TextColor?: ColorXML
  Title?: FormattedI8nTextXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormDecorationType
  UserVisible?: UserVisibleXML
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  VerticalStretch?: boolean
  Visible?: boolean
  Width?: number
}

export interface ExtendedTooltipEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Вид?: SE.FormDecorationTypeEnterprise
  Видимость?: StringboolEnterprise
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: FormattedI8nTextEnterprise
  ФорматированныйЗаголовок?: FormattedI8nTextEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ПропускатьПриВводе?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  СочетаниеКлавиш?: string
  ЦветТекста?: ColorEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
}
