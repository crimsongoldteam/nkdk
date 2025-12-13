import { Color, ColorXML, ColorEnterprise } from "~/lib/metadata/commonObjects/color/types";
import { I8nText, I8nTextXML, I8nTextEnterprise } from "~/lib/metadata/commonObjects/i8nText/types";
import { Picture, PictureXML, PictureEnterprise } from "~/lib/metadata/commonObjects/pictures/types";
import { UserVisible, UserVisibleXML, UserVisibleEnterprise } from "~/lib/metadata/commonObjects/userVisible/types";
import * as SE from "~/lib/metadata/systemEnumerations/types";
import { FormGroup, FormGroupXML, FormGroupEnterprise } from "../formGroup/types";
import { Table, TableXML, TableEnterprise } from "../table/types";
import { CommandBar, CommandBarXML, CommandBarEnterprise } from "../commandBar/types";
import { BaseElement, BaseElementXML, BaseElementEnterprise } from "../baseElement/types";
import { Font, FontXML, FontEnterprise } from "~/lib/metadata/commonObjects/font/types";
import { TypeDescription, TypeDescriptionXML, TypeDescriptionEnterprise } from "~/lib/metadata/commonObjects/typeDescription/types";
import { Border, BorderXML, BorderEnterprise } from "~/lib/metadata/commonObjects/border/types";
import { FormField, FormFieldXML, FormFieldEnterprise } from "../formField/types";
import { FormDecoration, FormDecorationEnterprise, FormDecorationXML } from "../formDecoration/types"
import { ChoiceList, ChoiceListXML, ChoiceListEnterprise } from "~/lib/metadata/commonObjects/choiceList/types"
import { FormItemAddition, FormItemAdditionXML, FormItemAdditionEnterprise } from "../formItemAddition/types"
import { TypeLink, TypeLinkXML, TypeLinkEnterprise } from "~/lib/metadata/commonObjects/typeLink/types"
import { ChoiceParameterLinks, ChoiceParameterLinksXML, ChoiceParameterLinksEnterprise } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/types"
import { SearchStringAddition, SearchStringAdditionXML, SearchStringAdditionEnterprise } from "~/lib/metadata/forms/elements/searchStringAddition/types"
import { ViewStatusAddition, ViewStatusAdditionXML, ViewStatusAdditionEnterprise } from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { SearchControlAddition, SearchControlAdditionXML, SearchControlAdditionEnterprise } from "~/lib/metadata/forms/elements/searchControlAddition/types"
import { CommandSet, CommandSetXML, CommandSetEnterprise } from "~/lib/metadata/forms/commandSet/types"
import { EventsXML } from "~/lib/metadata/forms/events/types";
import { ChildItems, ChildItemsXML } from "../childItems/types";


export interface FormattedDocumentField extends FormField {

  autoMaxHeight?: boolean,
  autoMaxWidth?: boolean,
  backColor?: Color,
  borderColor?: Color,
  font?: Font,
  height?: number,
  horizontalStretch?: boolean,
  maxHeight?: number,
  maxWidth?: number,
  output?: SE.UseOutput,
  selectedText?: string,
  textColor?: Color,
  userVisible?: UserVisible,
  verticalStretch?: boolean,
  width?: number,
  events?: {
    onChange?: string,
    beforeWrite?: string,
    beforePrint?: string,
    afterWrite?: string,
  },
}

export interface FormattedDocumentFieldXML extends FormFieldXML {
  
  AutoMaxHeight?: boolean,
  AutoMaxWidth?: boolean,
  BackColor?: ColorXML,
  BorderColor?: ColorXML,
  Font?: FontXML,
  Height?: number,
  HorizontalStretch?: boolean,
  MaxHeight?: number,
  MaxWidth?: number,
  Output?: SE.UseOutput,
  SelectedText?: string,
  TextColor?: ColorXML,
  UserVisible?: UserVisibleXML,
  VerticalStretch?: boolean,
  Width?: number,
  Events?: EventsXML,
}

export interface FormattedDocumentFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: boolean,
  АвтоМаксимальнаяШирина?: boolean,
  ЦветФона?: ColorEnterprise,
  ЦветРамки?: ColorEnterprise,
  Шрифт?: FontEnterprise,
  Высота?: number,
  РастягиватьПоГоризонтали?: boolean,
  МаксимальнаяВысота?: number,
  МаксимальнаяШирина?: number,
  Вывод?: SE.UseOutputEnterprise,
  ВыделенныйТекст?: string,
  ЦветТекста?: ColorEnterprise,
  ПользовательскаяВидимость?: UserVisibleEnterprise,
  РастягиватьПоВертикали?: boolean,
  Ширина?: number,
  События?: {
    ПриИзменении?: string,
    ПередЗаписью?: string,
    ПередПечатью?: string,
    ПослеЗаписи?: string,
  },
}