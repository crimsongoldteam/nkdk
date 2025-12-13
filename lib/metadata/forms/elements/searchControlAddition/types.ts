import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types";
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types";
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types";
import { FormItemAddition, FormItemAdditionEnterprise, FormItemAdditionXML } from "../formItemAddition/types";


export interface SearchControlAddition extends FormItemAddition {

  autoMaxWidth?: boolean,
  backColor?: Color,
  borderColor?: Color,
  font?: Font,
  horizontalStretch?: boolean,
  maxWidth?: number,
  textColor?: Color,
  userVisible?: UserVisible,
  width?: number,
}

export interface SearchControlAdditionXML extends FormItemAdditionXML {
  
  AutoMaxWidth?: boolean,
  BackColor?: ColorXML,
  BorderColor?: ColorXML,
  Font?: FontXML,
  HorizontalStretch?: boolean,
  MaxWidth?: number,
  TextColor?: ColorXML,
  UserVisible?: UserVisibleXML,
  Width?: number,
}

export interface SearchControlAdditionEnterprise extends FormItemAdditionEnterprise {
  АвтоМаксимальнаяШирина?: boolean,
  ЦветФона?: ColorEnterprise,
  ЦветРамки?: ColorEnterprise,
  Шрифт?: FontEnterprise,
  РастягиватьПоГоризонтали?: boolean,
  МаксимальнаяШирина?: number,
  ЦветТекста?: ColorEnterprise,
  ПользовательскаяВидимость?: UserVisibleEnterprise,
  Ширина?: number,
}