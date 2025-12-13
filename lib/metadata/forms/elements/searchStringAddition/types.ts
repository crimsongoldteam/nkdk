import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types";
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types";
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types";
import { FormItemAddition, FormItemAdditionEnterprise, FormItemAdditionXML } from "../formItemAddition/types";


export interface SearchStringAddition extends FormItemAddition {

  backColor?: Color,
  borderColor?: Color,
  font?: Font,
  horizontalStretch?: boolean,
  textColor?: Color,
  userVisible?: UserVisible,
  width?: number,
}

export interface SearchStringAdditionXML extends FormItemAdditionXML {
  
  BackColor?: ColorXML,
  BorderColor?: ColorXML,
  Font?: FontXML,
  HorizontalStretch?: boolean,
  TextColor?: ColorXML,
  UserVisible?: UserVisibleXML,
  Width?: number,
}

export interface SearchStringAdditionEnterprise extends FormItemAdditionEnterprise {
  ЦветФона?: ColorEnterprise,
  ЦветРамки?: ColorEnterprise,
  Шрифт?: FontEnterprise,
  РастягиватьПоГоризонтали?: boolean,
  ЦветТекста?: ColorEnterprise,
  ПользовательскаяВидимость?: UserVisibleEnterprise,
  Ширина?: number,
}