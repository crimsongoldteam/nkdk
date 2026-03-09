import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { ElementReferenceTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { PagesChildItems } from "../../commonObjects/childItems/types"
import { NamedElement } from "../baseElement/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "../extendedTooltip/types"
import { PagesRules } from "./rules"

export type PagesReference = ElementReferenceTypeByRule<typeof PagesRules>

export interface Pages extends NamedElement {
  itemType: "Pages"
  currentPagesState?: SE.FormPagesState
  currentRowUse?: SE.CurrentRowUse
  pagesRepresentation?: SE.FormPagesRepresentation
  enableContentChange?: boolean
  enabled?: boolean
  extendedTooltip?: ExtendedTooltip
  height?: number
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  horizontalStretch?: boolean
  readOnly?: boolean
  shortcut?: string
  title?: I8nText
  titleFont?: Font
  titleTextColor?: Color
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  type?: SE.FormGroupType
  userVisible?: UserVisible
  verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalStretch?: boolean
  visible?: boolean
  width?: number
  events?: {
    onCurrentPageChange?: string
  }
  childItems: PagesChildItems
}

export interface PagesPartialYAML {
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
  Вид?: SE.FormGroupTypeYAML
  Видимость?: StringboolYAML
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
  Доступность?: StringboolYAML
  Заголовок?: I8nTextYAML
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  Подсказка?: I8nTextYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  РазрешитьИзменениеСостава?: StringboolYAML
  РастягиватьПоВертикали?: StringboolYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  РасширеннаяПодсказка?: ExtendedTooltipYAML
  СочетаниеКлавиш?: string
  ТолькоПросмотр?: StringboolYAML
  ЦветТекстаЗаголовка?: ColorYAML
  Ширина?: number
  ШрифтЗаголовка?: FontYAML
  ИспользованиеТекущейСтроки?: SE.CurrentRowUseYAML
  ИспользуемаяТаблица?: string
  ОтображениеСтраниц?: SE.FormPagesRepresentationYAML
  ТекущееСостояниеСтраниц?: SE.FormPagesStateYAML
  События?: {
    ПриСменеСтраницы?: string
  }
}

export interface PagesTypedYAML extends PagesPartialYAML {
  Тип: "Страницы"
}

export type PagesEnterprise = EnterpriseType<typeof PagesRules>
