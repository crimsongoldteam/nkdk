import { Border, BorderEnterprise, BorderXML } from "~/lib/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { FormDecoration, FormDecorationEnterprise, FormDecorationXML } from "../formDecoration/types"

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
  ЦветФона?: ColorEnterprise
  Рамка?: BorderEnterprise
  ЦветРамки?: ColorEnterprise
  ВертикальноеВыравниваниеГруппы?: SE.ItemVerticalAlignEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  Гиперссылка?: boolean
  ВысотаЗаголовка?: number
  ПользовательскаяВидимость?: UserVisibleEnterprise
  ВертикальноеПоложение?: SE.ItemVerticalAlignEnterprise
  События?: {
    Нажатие?: string
    ОбработкаНавигационнойСсылки?: string
  }
}
