import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { ChoiceList, ChoiceListEnterprise, ChoiceListXML } from "~/metadata/commonObjects/choiceList/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/metadata/forms/elements/formField/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"

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
  ВидПереключателя?: SE.RadioButtonTypeEnterprise
  ВысотаЗаголовкаЭлемента?: number
  ВысотаЭлемента?: number
  КоличествоКолонок?: number
  ОдинаковаяШиринаКолонок?: StringboolEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  СписокВыбора?: ChoiceListEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  ШиринаЭлемента?: number
  Шрифт?: FontEnterprise
  События?: {
    ПриИзменении?: string
  }
}
