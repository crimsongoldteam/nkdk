import { Border, BorderEnterprise, BorderXML } from "~/lib/metadata/commonObjects/border/types";
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types";
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types";
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types";
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types";
import { EventsXML } from "~/lib/metadata/forms/events/types";
import { FormField, FormFieldEnterprise, FormFieldXML } from "../formField/types";


export interface LabelField extends FormField {

  autoMaxHeight?: boolean,
  autoMaxWidth?: boolean,
  backColor?: Color,
  border?: Border,
  borderColor?: Color,
  font?: Font,
  format?: I8nText,
  height?: number,
  horizontalStretch?: boolean,
  hyperlink?: boolean,
  markNegatives?: boolean,
  maxHeight?: number,
  maxWidth?: number,
  passwordMode?: boolean,
  textColor?: Color,
  userVisible?: UserVisible,
  verticalStretch?: boolean,
  width?: number,
  events?: {
    onChange?: string,
    click?: string,
    uRLProcessing?: string,
  },
}

export interface LabelFieldXML extends FormFieldXML {
  
  AutoMaxHeight?: boolean,
  AutoMaxWidth?: boolean,
  BackColor?: ColorXML,
  Border?: BorderXML,
  BorderColor?: ColorXML,
  Font?: FontXML,
  Format?: I8nTextXML,
  Height?: number,
  HorizontalStretch?: boolean,
  Hyperlink?: boolean,
  MarkNegatives?: boolean,
  MaxHeight?: number,
  MaxWidth?: number,
  PasswordMode?: boolean,
  TextColor?: ColorXML,
  UserVisible?: UserVisibleXML,
  VerticalStretch?: boolean,
  Width?: number,
  Events?: EventsXML,
}

export interface LabelFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: boolean,
  АвтоМаксимальнаяШирина?: boolean,
  ЦветФона?: ColorEnterprise,
  Рамка?: BorderEnterprise,
  ЦветРамки?: ColorEnterprise,
  Шрифт?: FontEnterprise,
  Формат?: I8nTextEnterprise,
  Высота?: number,
  РастягиватьПоГоризонтали?: boolean,
  Гиперссылка?: boolean,
  ВыделятьОтрицательные?: boolean,
  МаксимальнаяВысота?: number,
  МаксимальнаяШирина?: number,
  РежимПароля?: boolean,
  ЦветТекста?: ColorEnterprise,
  ПользовательскаяВидимость?: UserVisibleEnterprise,
  РастягиватьПоВертикали?: boolean,
  Ширина?: number,
  События?: {
    ПриИзменении?: string,
    Нажатие?: string,
    ОбработкаНавигационнойСсылки?: string,
  },
}