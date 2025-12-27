import { StringboolEnterprise } from "~/packages/core/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderXML } from "~/packages/core/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/packages/core/metadata/commonObjects/color/types"
import {
  UserVisible,
  UserVisibleEnterprise,
  UserVisibleXML,
} from "~/packages/core/metadata/commonObjects/userVisible/types"
import {
  FormDecoration,
  FormDecorationEnterprise,
  FormDecorationXML,
} from "~/packages/core/metadata/forms/elements/formDecoration/types"
import { EventsXML } from "~/packages/core/metadata/forms/events/types"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

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

export interface LabelDecorationEnterprise extends FormDecorationEnterprise {
  ВертикальноеВыравниваниеГруппы?: SE.ItemVerticalAlignEnterprise
  ВертикальноеПоложение?: SE.ItemVerticalAlignEnterprise
  ВысотаЗаголовка?: number
  Гиперссылка?: StringboolEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  Рамка?: BorderEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  События?: {
    Нажатие?: string
    ОбработкаНавигационнойСсылки?: string
  }
}
