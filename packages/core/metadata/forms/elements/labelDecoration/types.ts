import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderXML } from "~/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import {
  FormDecoration,
  FormDecorationPartialEnterprise,
  FormDecorationXML,
} from "~/metadata/forms/elements/formDecoration/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"

export interface LabelDecoration extends FormDecoration {
  backColor?: Color
  border?: Border
  borderColor?: Color
  groupVerticalAlign?: SE.ItemVerticalAlign
  horizontalAlign?: SE.ItemHorizontalLocation
  hyperlink?: boolean
  titleHeight?: number
  userVisible?: UserVisible
  verticalAlign?: SE.ItemVerticalAlign
  events?: {
    click?: string
    uRLProcessing?: string
  }
}

export interface LabelDecorationXML extends FormDecorationXML {
  BackColor?: ColorXML
  Border?: BorderXML
  BorderColor?: ColorXML
  GroupVerticalAlign?: SE.ItemVerticalAlign
  HorizontalAlign?: SE.ItemHorizontalLocation
  Hyperlink?: boolean
  TitleHeight?: number
  UserVisible?: UserVisibleXML
  VerticalAlign?: SE.ItemVerticalAlign
  Events?: EventsXML
}

export interface LabelDecorationPartialEnterprise extends FormDecorationPartialEnterprise {
  ВертикальноеВыравниваниеГруппы?: SE.ItemVerticalAlignEnterprise
  ВертикальноеПоложение?: SE.ItemVerticalAlignEnterprise
  ВысотаЗаголовка?: number
  Гиперссылка?: StringboolEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  Рамка?: BorderEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  События?: {
    Нажатие?: string
    ОбработкаНавигационнойСсылки?: string
  }
}

export interface LabelDecorationTypedEnterprise extends LabelDecorationPartialEnterprise {
  Тип: "Надпись"
}

// Для обратной совместимости
export type LabelDecorationEnterprise = LabelDecorationPartialEnterprise
