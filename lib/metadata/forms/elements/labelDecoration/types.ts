import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderXML } from "~/lib/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import {
  FormDecoration,
  FormDecorationEnterprise,
  FormDecorationXML,
} from "~/lib/metadata/forms/elements/formDecoration/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface LabelDecoration extends FormDecoration {
  backColor?: Color
  border?: Border
  borderColor?: Color
  groupVerticalAlign?: SE.ItemVerticalAlign
  horizontalAlign?: SE.ItemHorizontalLocation
  hyperlink?: boolean
  titleHeight?: number
  verticalAlign?: SE.ItemVerticalAlign
  userVisible?: UserVisible
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
  VerticalAlign?: SE.ItemVerticalAlign
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface LabelDecorationEnterprise extends FormDecorationEnterprise {
  ЦветФона?: ColorEnterprise
  Рамка?: BorderEnterprise
  ЦветРамки?: ColorEnterprise
  ВертикальноеВыравниваниеГруппы?: SE.ItemVerticalAlignEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  Гиперссылка?: StringboolEnterprise
  ВысотаЗаголовка?: number
  ВертикальноеПоложение?: SE.ItemVerticalAlignEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  События?: {
    Нажатие?: string
    ОбработкаНавигационнойСсылки?: string
  }
}
