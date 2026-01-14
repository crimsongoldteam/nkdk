import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormGroup } from "~/metadata/forms/elements/formGroup/types"
import { Table, TablePartialEnterprise, TableXML } from "~/metadata/forms/elements/table/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { BaseElementXML } from "../baseElement/types"
import { ExtendedTooltipEnterprise } from "../extendedTooltip/types"
import { Page, PageXML } from "../page/types"

export interface Pages extends Omit<FormGroup, "elementType"> {
  elementType: "Pages"
  associatedTable?: Table
  currentPagesState?: SE.FormPagesState
  currentRowUse?: SE.CurrentRowUse
  pagesRepresentation?: SE.FormPagesRepresentation
  userVisible?: UserVisible
  events?: {
    onCurrentPageChange?: string
  }
  childItems: Page[]
}

export interface PagesXML extends BaseElementXML {
  EnableContentChange?: boolean
  Enabled?: boolean
  Height?: number
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation
  HorizontalStretch?: boolean
  ReadOnly?: boolean
  Shortcut?: string
  Title?: I8nTextXML
  TitleFont?: FontXML
  TitleTextColor?: ColorXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormGroupType
  UserVisible?: UserVisibleXML
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  VerticalStretch?: boolean
  Visible?: boolean
  Width?: number
  AssociatedTable?: TableXML
  CurrentPagesState?: SE.FormPagesState
  CurrentRowUse?: SE.CurrentRowUse
  PagesRepresentation?: SE.FormPagesRepresentation
  Events?: EventsXML
  ChildItems?: PageXML[]
}

export interface PagesPartialEnterprise {
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Вид?: SE.FormGroupTypeEnterprise
  Видимость?: StringboolEnterprise
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РазрешитьИзменениеСостава?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  СочетаниеКлавиш?: string
  ТолькоПросмотр?: StringboolEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  Ширина?: number
  ШрифтЗаголовка?: FontEnterprise
  ИспользованиеТекущейСтроки?: SE.CurrentRowUseEnterprise
  ИспользуемаяТаблица?: TablePartialEnterprise
  ОтображениеСтраниц?: SE.FormPagesRepresentationEnterprise
  ТекущееСостояниеСтраниц?: SE.FormPagesStateEnterprise
  События?: {
    ПриСменеСтраницы?: string
  }
}

export interface PagesTypedEnterprise extends PagesPartialEnterprise {
  Тип: "Страницы"
}
