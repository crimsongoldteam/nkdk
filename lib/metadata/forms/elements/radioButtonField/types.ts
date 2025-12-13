import { ChoiceList, ChoiceListEnterprise, ChoiceListXML } from "~/lib/metadata/commonObjects/choiceList/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "../formField/types"

export interface RadioButtonField extends FormField {
  backColor?: Color
  borderColor?: Color
  choiceList?: ChoiceList
  columnsCount?: number
  equalColumnsWidth?: boolean
  font?: Font
  itemHeight?: number
  itemTitleHeight?: number
  itemWidth?: number
  radioButtonType?: SE.RadioButtonType
  textColor?: Color
  userVisible?: UserVisible
  events?: {
    onChange?: string
  }
}

export interface RadioButtonFieldXML extends FormFieldXML {
  BackColor?: ColorXML
  BorderColor?: ColorXML
  ChoiceList?: ChoiceListXML
  ColumnsCount?: number
  EqualColumnsWidth?: boolean
  Font?: FontXML
  ItemHeight?: number
  ItemTitleHeight?: number
  ItemWidth?: number
  RadioButtonType?: SE.RadioButtonType
  TextColor?: ColorXML
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface RadioButtonFieldEnterprise extends FormFieldEnterprise {
  ЦветФона?: ColorEnterprise
  ЦветРамки?: ColorEnterprise
  СписокВыбора?: ChoiceListEnterprise
  КоличествоКолонок?: number
  ОдинаковаяШиринаКолонок?: boolean
  Шрифт?: FontEnterprise
  ВысотаЭлемента?: number
  ВысотаЗаголовкаЭлемента?: number
  ШиринаЭлемента?: number
  ВидПереключателя?: SE.RadioButtonTypeEnterprise
  ЦветТекста?: ColorEnterprise
  ПользовательскаяВидимость?: UserVisibleEnterprise
  События?: {
    ПриИзменении?: string
  }
}
