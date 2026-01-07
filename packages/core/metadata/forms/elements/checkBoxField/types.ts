import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/metadata/forms/elements/formField/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"

export interface CheckBoxField extends FormField {
  backColor?: Color
  borderColor?: Color
  checkBoxType?: SE.CheckBoxType
  editFormat?: I8nText
  equalItemsWidth?: boolean
  font?: Font
  itemHeight?: number
  itemTitleHeight?: number
  itemWidth?: number
  textColor?: Color
  threeState?: boolean
  userVisible?: UserVisible
  events?: {
    onChange?: string
  }
}

export interface CheckBoxFieldXML extends FormFieldXML {
  BackColor?: ColorXML
  BorderColor?: ColorXML
  CheckBoxType?: SE.CheckBoxType
  EditFormat?: I8nTextXML
  EqualItemsWidth?: boolean
  Font?: FontXML
  ItemHeight?: number
  ItemTitleHeight?: number
  ItemWidth?: number
  TextColor?: ColorXML
  ThreeState?: boolean
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface CheckBoxFieldEnterprise extends FormFieldEnterprise {
  ВидФлажка?: SE.CheckBoxTypeEnterprise
  ВысотаЗаголовкаЭлемента?: number
  ВысотаЭлемента?: number
  ОдинаковаяШиринаЭлементов?: StringboolEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ТриСостояния?: StringboolEnterprise
  ФорматРедактирования?: I8nTextEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  ШиринаЭлемента?: number
  Шрифт?: FontEnterprise
  События?: {
    ПриИзменении?: string
  }
}
