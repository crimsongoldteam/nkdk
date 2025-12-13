import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types";
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types";
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types";
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types";
import { EventsXML } from "~/lib/metadata/forms/events/types";
import * as SE from "~/lib/metadata/systemEnumerations/types";
import { FormField, FormFieldEnterprise, FormFieldXML } from "../formField/types";


export interface CheckBoxField extends FormField {

  backColor?: Color,
  borderColor?: Color,
  checkBoxType?: SE.CheckBoxType,
  editFormat?: I8nText,
  equalItemsWidth?: boolean,
  font?: Font,
  itemHeight?: number,
  itemTitleHeight?: number,
  itemWidth?: number,
  textColor?: Color,
  threeState?: boolean,
  userVisible?: UserVisible,
  events?: {
    onChange?: string,
  },
}

export interface CheckBoxFieldXML extends FormFieldXML {
  
  BackColor?: ColorXML,
  BorderColor?: ColorXML,
  CheckBoxType?: SE.CheckBoxType,
  EditFormat?: I8nTextXML,
  EqualItemsWidth?: boolean,
  Font?: FontXML,
  ItemHeight?: number,
  ItemTitleHeight?: number,
  ItemWidth?: number,
  TextColor?: ColorXML,
  ThreeState?: boolean,
  UserVisible?: UserVisibleXML,
  Events?: EventsXML,
}

export interface CheckBoxFieldEnterprise extends FormFieldEnterprise {
  ЦветФона?: ColorEnterprise,
  ЦветРамки?: ColorEnterprise,
  ВидФлажка?: SE.CheckBoxTypeEnterprise,
  ФорматРедактирования?: I8nTextEnterprise,
  ОдинаковаяШиринаЭлементов?: boolean,
  Шрифт?: FontEnterprise,
  ВысотаЭлемента?: number,
  ВысотаЗаголовкаЭлемента?: number,
  ШиринаЭлемента?: number,
  ЦветТекста?: ColorEnterprise,
  ТриСостояния?: boolean,
  ПользовательскаяВидимость?: UserVisibleEnterprise,
  События?: {
    ПриИзменении?: string,
  },
}